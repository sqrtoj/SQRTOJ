async function sha512Hash(string) {
   return crypto.subtle.digest("SHA-512", new TextEncoder("utf-8").encode(string)).then(buf => {
       return Array.prototype.map.call(new Uint8Array(buf), x => (('00' + x.toString(16)).slice(-2))).join('');
   });
}

function uniqueByKey(array, key) {
   const seen = new Set();
   return array.filter(item => {
       if (seen.has(item[key])) return false;
       seen.add(item[key]);
       return true;
   });
}

let resolverConfig = {
   scoreDecimals: 0,
   timeDecimals: 0,
   animDurationPerRow: 700,
   autoDelay: 900,
};

function loadConfig() {
   resolverConfig.scoreDecimals = Math.max(0, parseInt(document.getElementById("config-score-decimals").value) || 0);
   resolverConfig.timeDecimals = Math.max(0, parseInt(document.getElementById("config-time-decimals").value) || 0);
   resolverConfig.animDurationPerRow = Math.max(200, parseInt(document.getElementById("config-anim-per-row").value) || 700);
   resolverConfig.autoDelay = Math.max(0, parseInt(document.getElementById("config-auto-delay").value) || 900);
}

function formatScore(score) {
   return resolverConfig.scoreDecimals > 0 ? Number(score).toFixed(resolverConfig.scoreDecimals) : Math.round(score);
}

function formatTime(time) {
   return resolverConfig.timeDecimals > 0 ? Number(time).toFixed(resolverConfig.timeDecimals) : Math.round(time);
}

class Animator {
   constructor(x, acceleration, maxSpeed) {
       this.acceleration = acceleration;
       this.maxSpeed = maxSpeed;
       this.xInitial = x;
       this.xTarget = x;
       this.accSign = 1;
       this.t1 = 0;
       this.tCoast = 0;
       this.t = 0;
   }

   incrementTimeMs(dt) { this.t += dt; }

   getValue() {
       const tt = this.t / 1000;
       if (tt <= 0) return this.xInitial;
       const { xInitial, xTarget, t1, tCoast, acceleration, maxSpeed, accSign } = this;
       const sa = accSign * acceleration;
       const sv = accSign * maxSpeed;
       if (tt < t1) {
           return xInitial + sa * tt * tt / 2;
       } else if (tt < t1 + tCoast) {
           return xInitial + sa * t1 * t1 / 2 + (tt - t1) * sv;
       } else if (tt < t1 * 2 + tCoast) {
           const r = (t1 * 2 + tCoast) - tt;
           return xTarget - sa * r * r / 2;
       }
       return xTarget;
   }

   setTarget(x) {
       if (Math.abs(x - this.xTarget) < 0.001) return;
       this.xInitial = this.getValue();
       this.xTarget = x;
       this.t = 0;
       const dist = Math.abs(x - this.xInitial);
       if (dist < 0.001) { this.t1 = 0; this.tCoast = 0; return; }
       this.accSign = x > this.xInitial ? 1 : -1;
       this.t1 = Math.sqrt(dist / this.acceleration);
       const mt = this.maxSpeed / this.acceleration;
       if (this.t1 > mt) {
           this.tCoast = (dist - this.acceleration * mt * mt) / this.maxSpeed;
           this.t1 = mt;
       } else {
           this.tCoast = 0;
       }
   }

   resetToTarget() { this.xInitial = this.xTarget; this.t1 = 0; this.tCoast = 0; this.t = 0; }
   getDurationMs() { return (this.t1 * 2 + this.tCoast) * 1000; }
}

const teamAnimators = new Map();
const teamBoxMap = new Map();
const standingsRowHeight = 60;
const defaultUserLogo = new URL("icons/default-user.png", document.currentScript?.src || window.location.href).href;

let animFrameId = null;
let lastFrameTime = null;

function startAnimationLoop() {
   if (animFrameId !== null) return;
   lastFrameTime = performance.now();
   animFrameId = requestAnimationFrame(animTick);
}

function stopAnimationLoop() {
   if (animFrameId !== null) { cancelAnimationFrame(animFrameId); animFrameId = null; }
}

function animTick(ts) {
   const dt = ts - lastFrameTime;
   lastFrameTime = ts;
   const total = teamAnimators.size;
   teamAnimators.forEach((anim, name) => {
       anim.incrementTimeMs(dt);
       const box = teamBoxMap.get(name);
       if (box) {
           box.style.top = anim.getValue() * standingsRowHeight + "px";
           box.style.zIndex = total - anim.xTarget;
       }
   });
   animFrameId = requestAnimationFrame(animTick);
}

function getColorForScore(score, maxScore) {
   score = Math.max(0, Math.min(maxScore, score));
   const startColor = { r: 167, g: 11, b: 11 };
   const midColor = { r: 167, g: 167, b: 11 };
   const endColor = { r: 11, g: 167, b: 11 };
   let r, g, b;
   const midPoint = maxScore / 2;
   if (score <= midPoint) {
       const ratio = score / midPoint;
       r = Math.round(startColor.r + (midColor.r - startColor.r) * ratio);
       g = Math.round(startColor.g + (midColor.g - startColor.g) * ratio);
       b = Math.round(startColor.b + (midColor.b - startColor.b) * ratio);
   } else {
       const ratio = (score - midPoint) / midPoint;
       r = Math.round(midColor.r + (endColor.r - midColor.r) * ratio);
       g = Math.round(midColor.g + (endColor.g - midColor.g) * ratio);
       b = Math.round(midColor.b + (endColor.b - midColor.b) * ratio);
   }
   const toHex = (c) => c.toString(16).padStart(2, '0');
   return "#" + toHex(r) + toHex(g) + toHex(b);
}

function changeOption() {
   const form = document.getElementById("form");
   for (let i = 0; i < form.children.length; i++) {
       const child = form.children[i];
       if (child.id.startsWith("input-")) {
           child.style.display = "none";
       }
   }
   const option = document.getElementById("option").value;
   document.getElementById("input-" + option).style.display = "flex";
}

function readJSON() {
   const file = document.getElementById("file").files[0];
   if (!file) {
       alert("Please select a file");
       return;
   }
   const jsonText = document.getElementById("json-data");
   const reader = new FileReader();
   reader.onload = function (e) {
       jsonText.value = e.target.result;
   };
   reader.readAsText(file);
}

async function fetchAPI(method, params, apiKey, apiSecret) {
   let url = "https://codeforces.com/api/" + method + "?" + (new URLSearchParams(params).toString());
   if (apiKey && apiSecret) {
       const time = Math.floor(Date.now() / 1000);
       const rand = Math.floor(Math.random() * (10 ** 6 - 10 ** 5 - 1)) + 10 ** 5;
       params.apiKey = apiKey;
       params.time = time;
       params = Object.fromEntries(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)));
       const hash = await sha512Hash(rand + "/" + method + "?" + (new URLSearchParams(params).toString()) + "#" + apiSecret);
       url += "&apiKey=" + apiKey + "&time=" + time + "&apiSig=" + rand + hash;
   }
   const response = await fetch(url);
   let { status, result, comment } = await response.json();
   if (comment) {
       comment = comment.split(";");
   }
   return { status, result, comment };
}

async function fetchContest() {
   const contestId = document.getElementById("contestId").value.trim();
   const apiKey = document.getElementById("apiKey").value.trim();
   const apiSecret = document.getElementById("apiSecret").value.trim();
   if (!contestId || !apiKey || !apiSecret) {
       return;
   }
   const jsonText = document.getElementById("json-data");
   jsonText.value = "Fetching contest info and problems...";
   let { status, result, comment } = await fetchAPI("contest.standings", { contestId, participantTypes: "CONTESTANT", asManager: true }, apiKey, apiSecret);
   let contest, problems;
   if (status != "OK") {
       jsonText.value = comment.join("\n");
       return;
   } else {
       jsonText.value += " done\n";
       ({ contest, problems } = result);
   }
   jsonText.value += "Waiting between requests...";
   await new Promise(resolve => setTimeout(resolve, 2500));
   jsonText.value += " done\n";
   jsonText.value += "Fetching contest submissions...";
   ({ status, result, comment } = await fetchAPI("contest.status", { contestId, asManager: true }, apiKey, apiSecret));
   let submissions;
   if (status != "OK") {
       jsonText.value = comment.join("\n");
       return;
   } else {
       jsonText.value += " done\n";
       submissions = result;
   }
   submissions = submissions.filter(submission => submission.author.participantType == "CONTESTANT");
   const verdicts = ["OK", "PARTIAL", "RUNTIME_ERROR", "WRONG_ANSWER", "PRESENTATION_ERROR", "TIME_LIMIT_EXCEEDED", "MEMORY_LIMIT_EXCEEDED", "IDLENESS_LIMIT_EXCEEDED"];
   submissions = submissions.filter(submission => verdicts.includes(submission.verdict));
   submissions = submissions.reverse();
   const contestants = uniqueByKey([...new Set(submissions.map(submission => submission.author.members[0]))], "handle");
   for (let i = 0; i < contestants.length; i++) {
       contestants[i].index = i;
   }
   const realContestants = contestants.filter(contestant => !contestant.handle.includes("="));
   if (realContestants.length != 0) {
       jsonText.value += "Waiting between requests...";
       await new Promise(resolve => setTimeout(resolve, 2500));
       jsonText.value += " done\n";
       jsonText.value += "Fetching contestant info...";
       ({ status, result, comment } = await fetchAPI("user.info", { handles: realContestants.map(contestant => contestant.handle).join(";"), checkHistoricHandles: false }));
       let users;
       if (status != "OK") {
           jsonText.value = comment.join("\n");
           return;
       } else {
           jsonText.value += " done\n";
           users = result;
       }
       for (let i = 0; i < realContestants.length; i++) {
           contestants[realContestants[i].index].logo = users[i].titlePhoto || users[i].avatar;
           contestants[realContestants[i].index].rank = users[i].rank;
       }
   }
   const data = {};
   data.contest = {};
   data.contest.name = contest.name;
   data.contest.durationMinutes = Math.floor(contest.durationSeconds / 60);
   data.contest.freezeDurationMinutes = Math.floor(contest.freezeDurationSeconds / 60);
   data.contest.penaltyMinutes = 20;
   data.problems = problems.map(problem => {
       return {
           index: problem.index,
           points: problem.points || (contest.type == "IOI" ? 100 : 1),
       };
   });
   data.contestants = contestants.map(contestant => {
       return {
           name: contestant.name || contestant.handle,
           logo: contestant.logo,
           rank: contestant.rank,
       };
   });
   data.submissions = submissions.map(submission => {
       return {
           name: submission.author.members[0].name || submission.author.members[0].handle,
           problemIndex: submission.problem.index,
           submitMinutes: Math.floor(submission.relativeTimeSeconds / 60),
           points: submission.points || (submission.verdict == "OK" ? 1 : 0),
       };
   });
   jsonText.value = JSON.stringify(data, null, 2);
}

function validateJSONFormat(jsonString, schema) {
   try {
       const obj = JSON.parse(jsonString);
       return validateObject(obj, schema);
   } catch (e) {
       return "Invalid JSON: " + e.message;
   }
}

function validateObject(obj, schema, path = "") {
   for (const [key, type] of Object.entries(schema)) {
       const currentPath = path ? path + "." + key : key;
       if (!(key in obj)) {
           return "Missing key: " + currentPath;
       }
       if (Array.isArray(type)) {
           if (!Array.isArray(obj[key])) {
               return "Expected an array at: " + currentPath;
           }
           for (let i = 0; i < obj[key].length; i++) {
               const error = validateObject(obj[key][i], type[0], currentPath + "[" + i + "]");
               if (error) {
                   return error;
               }
           }
       } else if (typeof type === "object") {
           if (typeof obj[key] !== "object" || Array.isArray(obj[key])) {
               return "Expected an object at: " + currentPath;
           }
           const error = validateObject(obj[key], type, currentPath);
           if (error) {
               return error;
           }
       } else if (typeof obj[key] !== type) {
           return "Type mismatch at: " + currentPath + " (Expected " + type + ", got " + typeof obj[key] + ")";
       }
   }
   return null;
}

function validateJSON() {
   const text = document.getElementById("json-data").value;
   const schema = {
       contest: {
           name: "string",
           durationMinutes: "number",
           freezeDurationMinutes: "number",
           penaltyMinutes: "number",
       },
       problems: [
           {
               index: "string",
               points: "number",
           },
       ],
       contestants: [
           {
               name: "string",
           },
       ],
       submissions: [
           {
               name: "string",
               problemIndex: "string",
               submitMinutes: "number",
               points: "number",
           },
       ]
   };
   const error = validateJSONFormat(text, schema);
   if (error) {
       alert(error);
       return false;
   }
   const { contest, problems, contestants, submissions } = JSON.parse(text);
   if (contest.durationMinutes <= 0) {
       alert("Invalid contest duration");
       return false;
   }
   if (contest.freezeDurationMinutes < 0 || contest.freezeDurationMinutes > contest.durationMinutes) {
       alert("Invalid freeze duration");
       return false;
   }
   if (contest.penaltyMinutes < 0) {
       alert("Invalid penalty duration");
       return false;
   }
   const problemIndexes = new Set();
   for (const problem of problems) {
       if (problemIndexes.has(problem.index)) {
           alert("Duplicate problem index: " + problem.index);
           return false;
       }
       problemIndexes.add(problem.index);
       if (problem.points <= 0) {
           alert("Invalid points for problem " + problem.index);
           return false;
       }
   }
   const contestantNames = new Set();
   for (const contestant of contestants) {
       if (contestantNames.has(contestant.name)) {
           alert("Duplicate contestant name: " + contestant.name);
           return false;
       }
       contestantNames.add(contestant.name);
   }
   for (const submission of submissions) {
       if (!problemIndexes.has(submission.problemIndex)) {
           alert("Invalid problem index: " + submission.problemIndex);
           return false;
       }
       if (!contestantNames.has(submission.name)) {
           alert("Invalid contestant name: " + submission.name);
           return false;
       }
       if (submission.submitMinutes < 0 || submission.submitMinutes >= contest.durationMinutes) {
           alert("Invalid submit time for " + submission.name + " at " + submission.problemIndex + ": " + submission.submitMinutes);
           return false;
       }
       if (submission.points < 0 || submission.points > problems.find(problem => problem.index == submission.problemIndex).points) {
           alert("Invalid points for " + submission.name + " at " + submission.problemIndex + ": " + submission.points);
           return false;
       }
   }
   return true;
}

let currentScreen = 0;

function startContest() {
   if (!validateJSON()) {
       return;
   }
   loadConfig();
   document.getElementById("input-screen").classList.toggle("hidden");
   document.getElementById("splash-screen").classList.toggle("hidden");
   currentScreen = 1;
   let pendingSubmissions = 0;
   const { contest, submissions } = JSON.parse(document.getElementById("json-data").value);
   submissions.forEach(submission => {
       if (submission.submitMinutes >= contest.durationMinutes - contest.freezeDurationMinutes) {
           pendingSubmissions++;
       }
   });
   document.getElementById("contest-name").textContent = contest.name;
   document.getElementById("pending-count").textContent = pendingSubmissions + " pending submission" + (pendingSubmissions == 1 ? "" : "s");
}

const pendingSubmissionColor = "rgb(16, 16, 160)";
const firstSolvedColor = "#105010";
const solvedColor = "rgb(16, 160, 16)";
const wrongSubmissionColor = "rgb(160, 16, 16)";
const activeTeamColor = "rgb(87, 130, 87)";

function isAcceptedScore(score, problemIndex) {
   return score >= problemScore[problemIndex] - 1e-9;
}

function createProblemStats() {
   return {
       score: 0,
       accepted: false,
       acceptMinutes: null,
       submissionsToAccept: 0,
       totalSubmissions: 0,
       lastSubmitMinutes: null,
   };
}

function applySubmissionToStats(stats, submission, maxScore) {
   stats.totalSubmissions++;
   stats.lastSubmitMinutes = submission.submitMinutes;
   if (!stats.accepted && submission.points >= maxScore - 1e-9) {
       stats.accepted = true;
       stats.score = maxScore;
       stats.acceptMinutes = submission.submitMinutes;
       stats.submissionsToAccept = stats.totalSubmissions;
   } else if (!stats.accepted && submission.points > stats.score) {
       stats.score = submission.points;
   }
}

function formatProblemStats(stats) {
   if (!stats || stats.totalSubmissions == 0) return "";
   if (stats.accepted) {
       return stats.submissionsToAccept + " - " + formatTime(stats.acceptMinutes);
   }
   return stats.totalSubmissions + " - " + formatTime(stats.lastSubmitMinutes);
}

function getProblemBoxColor(problem, stats) {
   if (!stats || stats.totalSubmissions == 0) return "#282828";
   if (stats.accepted) {
       return firstSolvedProblems[problem.index] == stats.acceptMinutes ? firstSolvedColor : solvedColor;
   }
   return wrongSubmissionColor;
}

let penaltyPerSubmission = 20;

function getTotalPenalty(stats) {
   if (!stats || !stats.accepted) return 0;
   return stats.acceptMinutes + Math.max(stats.submissionsToAccept - 1, 0) * penaltyPerSubmission;
}

let isStarting = false;
let standings = [];
const problemIndex = {};
const problemScore = {};
const firstSolvedProblems = {};
let currentIndex = 0;
let currentAction = 0;

function isAnimating() {
   for (let anim of teamAnimators.values()) {
       if (anim.t < Math.min(anim.getDurationMs(), 500)) return true;
   }
   return false;
}

function getHeaderHeight() {
   return document.getElementById("header")?.offsetHeight || 0;
}

function getStandingsTop() {
   return document.getElementById("standings")?.offsetTop || getHeaderHeight();
}

function scrollToStandingRow(rowIndex, behavior = "smooth", align = "nearest") {
   if (rowIndex < 0 || rowIndex >= standings.length) return;
   const headerH = getHeaderHeight();
   const rowTop = getStandingsTop() + rowIndex * standingsRowHeight;
   const rowBottom = rowTop + standingsRowHeight;
   const visibleTop = window.scrollY + headerH;
   const visibleBottom = window.scrollY + window.innerHeight;
   let top = null;
  
   if (align == "start") {
       top = rowTop - headerH;
   } else if (align == "bottom") {
       top = rowBottom - window.innerHeight;
   } else if (align == "center") {
       top = rowTop - Math.max(headerH, Math.floor((window.innerHeight - standingsRowHeight) / 2));
   } else if (rowTop < visibleTop) {
       top = rowTop - headerH;
   } else if (rowBottom > visibleBottom) {
       top = rowBottom - window.innerHeight;
   }
  
   if (top !== null) {
       window.scrollTo({ top: Math.max(0, top), behavior });
   }
}

function processContest() {
   stopAnimationLoop();
   teamAnimators.clear();
   teamBoxMap.clear();
   isStarting = false;
   if (currentScreen == 1) {
       document.getElementById("splash-screen").classList.toggle("hidden");
       document.getElementById("output-screen").classList.toggle("hidden");
       currentScreen = 2;
   }
   const { contest, problems, contestants, submissions } = JSON.parse(document.getElementById("json-data").value);
   penaltyPerSubmission = contest.penaltyMinutes;
   const animAcc = Math.pow(2000 / resolverConfig.animDurationPerRow, 2);
   const animMaxSpeed = animAcc * 1.75;
   const headerProblemsEl = document.getElementById("header-problems");
   if (headerProblemsEl) {
       headerProblemsEl.remove();
   }
   Object.keys(problemIndex).forEach(key => delete problemIndex[key]);
   Object.keys(problemScore).forEach(key => delete problemScore[key]);
   Object.keys(firstSolvedProblems).forEach(key => delete firstSolvedProblems[key]);
   problems.forEach((problem, index) => {
       problemIndex[problem.index] = index;
       problemScore[problem.index] = problem.points;
   });
   submissions.forEach(submission => {
       if (!isAcceptedScore(submission.points, submission.problemIndex)) return;
       if (!(submission.problemIndex in firstSolvedProblems) ||
               submission.submitMinutes < firstSolvedProblems[submission.problemIndex]) {
           firstSolvedProblems[submission.problemIndex] = submission.submitMinutes;
       }
   });
   const standingsContainer = document.getElementById("standings");
   standingsContainer.innerHTML = "";

   standings = contestants.map(contestant => {
       const userSubmissions = submissions.filter(submission => submission.name == contestant.name);
       const userProblems = problems.map(problem => {
           const userProblemSubmissions = userSubmissions.filter(submission => submission.problemIndex == problem.index);
           const beforeFreeze = createProblemStats();
           const afterFreeze = createProblemStats();
           const data = {
               index: problem.index,
               beforeFreeze: null,
               afterFreeze: null,
               submitAfterFreeze: false,
               totalSubmissionsAll: userProblemSubmissions.length,
               lastSubmitMinutesAll: userProblemSubmissions.length > 0 ? userProblemSubmissions[userProblemSubmissions.length - 1].submitMinutes : 0
           }

           const freezeStart = contest.durationMinutes - contest.freezeDurationMinutes;

           for (const submission of userProblemSubmissions) {
               if (submission.submitMinutes < freezeStart) {
                   if (!beforeFreeze.accepted) {
                       applySubmissionToStats(beforeFreeze, submission, problem.points);
                   }
               }
           }

           if (beforeFreeze.accepted) {
               data.submitAfterFreeze = false;
               data.beforeFreeze = beforeFreeze;
               data.afterFreeze = beforeFreeze;
           } else {
               const hasAfterFreeze = userProblemSubmissions.some(submission => submission.submitMinutes >= freezeStart);
               if (hasAfterFreeze) {
                   data.submitAfterFreeze = true;
                   for (const submission of userProblemSubmissions) {
                       if (!afterFreeze.accepted) {
                           applySubmissionToStats(afterFreeze, submission, problem.points);
                       }
                   }
               } else {
                   data.submitAfterFreeze = false;
                   for (const submission of userProblemSubmissions) {
                       if (!afterFreeze.accepted) {
                           applySubmissionToStats(afterFreeze, submission, problem.points);
                       }
                   }
               }
               data.beforeFreeze = beforeFreeze.totalSubmissions ? beforeFreeze : null;
               data.afterFreeze = afterFreeze.totalSubmissions ? afterFreeze : null;
           }

           return data;
       });

       const totalScore = userProblems.reduce((acc, problem) => {
           return acc + (problem.beforeFreeze && problem.beforeFreeze.accepted ? 1 : 0);
       }, 0);
       const totalTime = userProblems.reduce((acc, problem) => {
           return acc + getTotalPenalty(problem.beforeFreeze);
       }, 0);
       return {
           rank: 0,
           name: contestant.name,
           logo: contestant.logo,
           rankCF: contestant.rank,
           problems: userProblems,
           totalScore,
           totalTime,
       };
   });

   standings.sort((a, b) => {
       if (a.totalScore != b.totalScore) {
           return b.totalScore - a.totalScore;
       }
       return a.totalTime - b.totalTime;
   });
   if (standings.length) standings[0].rank = 1;
   for (let i = 1; i < standings.length; i++) {
       if (standings[i].totalScore == standings[i - 1].totalScore && standings[i].totalTime == standings[i - 1].totalTime) {
           standings[i].rank = standings[i - 1].rank;
       } else {
           standings[i].rank = i + 1;
       }
   }
   currentIndex = standings.length - 1;
   currentAction = 0;
   const rankToColor = {
       "none": "#aaa",
       "newbie": "#988f81",
       "pupil": "#72ff72",
       "specialist": "#57fcf2",
       "expert": "#337dff",
       "candidate-master": "#ff55ff",
       "master": "#ff981a",
       "international-master": "#ff981a",
       "grandmaster": "#ff1a1a",
       "international-grandmaster": "#ff1a1a",
       "legendary-grandmaster": "#ff1a1a",
   }

   standings.forEach((user, rowIndex) => {
       const rankBox = document.createElement("div");
       rankBox.classList.add("rank-box");
       rankBox.style.top = rowIndex * standingsRowHeight + "px";
       teamBoxMap.set(user.name, rankBox);
       teamAnimators.set(user.name, new Animator(rowIndex, animAcc, animMaxSpeed));
       const rankDiv = document.createElement("div");
       rankDiv.classList.add("rank");
       rankDiv.textContent = user.rank;
       const logoDiv = document.createElement("img");
       logoDiv.classList.add("logo");
       logoDiv.src = user.logo || defaultUserLogo;
       logoDiv.loading = "lazy";
       logoDiv.onerror = function() { this.onerror=null; this.src=defaultUserLogo; };
       const userInfoDiv = document.createElement("div");
       userInfoDiv.classList.add("user-info");
       const nameDiv = document.createElement("div");
       nameDiv.classList.add("name");
       nameDiv.textContent = user.name;
       if (user.rankCF) {
           let rKey = user.rankCF.toLowerCase().replace(" ", "-");
           if (rKey.startsWith("rate-")) rKey = rKey.substring(5);
           const color = rankToColor[rKey];
           if (color) {
               nameDiv.style.color = color;
               nameDiv.style.fontWeight = "bold";
           }
       }
       const problemPointsDiv = document.createElement("div");
       problemPointsDiv.classList.add("problem-points");
       user.problems.forEach(problem => {
           const pointBox = document.createElement("div");
           pointBox.classList.add("point-box");
           if (problem.submitAfterFreeze) {
               pointBox.textContent = problem.totalSubmissionsAll + " - " + formatTime(problem.lastSubmitMinutesAll);
               pointBox.style.background = pendingSubmissionColor;
               pointBox.style.color = "#ffffff";
           } else if (problem.beforeFreeze) {
               pointBox.textContent = formatProblemStats(problem.beforeFreeze);
               pointBox.style.background = getProblemBoxColor(problem, problem.beforeFreeze);
               pointBox.style.color = "#ffffff";
           } else {
               pointBox.textContent = problem.index;
               pointBox.style.background = "#282828";
               pointBox.style.color = "#646464";
           }
           problemPointsDiv.appendChild(pointBox);
       });
       userInfoDiv.appendChild(nameDiv);
       userInfoDiv.appendChild(problemPointsDiv);
       const totalScoreDiv = document.createElement("div");
       totalScoreDiv.classList.add("total-score");
       totalScoreDiv.textContent = user.totalScore;
       const totalTimeDiv = document.createElement("div");
       totalTimeDiv.classList.add("total-time");
       totalTimeDiv.textContent = formatTime(user.totalTime);
       rankBox.appendChild(rankDiv);
       rankBox.appendChild(logoDiv);
       rankBox.appendChild(userInfoDiv);
       rankBox.appendChild(totalScoreDiv);
       rankBox.appendChild(totalTimeDiv);
       standingsContainer.appendChild(rankBox);
   });
   standingsContainer.style.height = standings.length * standingsRowHeight + "px";
   startAnimationLoop();
   isStarting = true;
}

function getBoxByName(name) {
   return teamBoxMap.get(name) || null;
}

function getPendingProblemIndex(user) {
   return user.problems.findIndex(p => p.submitAfterFreeze);
}

function clearTeamHighlight(box) {
   if (box) box.style.background = "";
}

function run(auto = false) {
   return new Promise(resolve => {
       if (currentAction == 0) {
           if (currentIndex < standings.length - 1 && currentIndex >= -1) {
               const prevUser = standings[currentIndex + 1];
               if (prevUser) {
                   const prevBox = teamBoxMap.get(prevUser.name);
                   clearTeamHighlight(prevBox);
               }
           }
           scrollToStandingRow(currentIndex);
           if (currentIndex == -1) {
               currentAction = -1;
               resolve();
               return;
           }
           const unfrozenIndex = getPendingProblemIndex(standings[currentIndex]);
           const currentBox = teamBoxMap.get(standings[currentIndex].name);
           currentBox.style.background = activeTeamColor;
           if (unfrozenIndex == -1) {
               currentIndex--;
               currentAction = 0;
               scrollToStandingRow(currentIndex + 1, "smooth", "bottom");
               setTimeout(resolve, auto ? resolverConfig.autoDelay : 0);
               return;
           }
           currentAction = 1;
           setTimeout(resolve, auto ? resolverConfig.autoDelay : 0);
       } else if (currentAction == 1) {
           const unfrozenIndex = getPendingProblemIndex(standings[currentIndex]);
           if (unfrozenIndex == -1) {
               currentAction = 0;
               currentIndex--;
               setTimeout(resolve, 0);
           } else {
               const currentProblem = standings[currentIndex].problems[unfrozenIndex];
               const currentBox = teamBoxMap.get(standings[currentIndex].name);
               currentBox.querySelector(".problem-points").children[problemIndex[currentProblem.index]].style.borderColor = "lightgray";
               currentAction = 2;
               setTimeout(resolve, auto ? resolverConfig.autoDelay : 0);
           }
       } else if (currentAction == 2) {
           const unfrozenIndex = getPendingProblemIndex(standings[currentIndex]);
           const currentProblem = standings[currentIndex].problems[unfrozenIndex];
           const currentBox = teamBoxMap.get(standings[currentIndex].name);
           const problemBox = currentBox.querySelector(".problem-points").children[problemIndex[currentProblem.index]];
           const totalScoreDiv = currentBox.querySelector(".total-score");
           const totalTimeDiv = currentBox.querySelector(".total-time");
           problemBox.textContent = formatProblemStats(currentProblem.afterFreeze);
           problemBox.style.background = getProblemBoxColor(currentProblem, currentProblem.afterFreeze);
           problemBox.style.color = "#ffffff";
           problemBox.style.borderColor = "transparent";
           const previousSolved = currentProblem.beforeFreeze && currentProblem.beforeFreeze.accepted ? 1 : 0;
           const nextSolved = currentProblem.afterFreeze && currentProblem.afterFreeze.accepted ? 1 : 0;
           totalScoreDiv.textContent = standings[currentIndex].totalScore += nextSolved - previousSolved;
           totalTimeDiv.textContent = formatTime(standings[currentIndex].totalTime += getTotalPenalty(currentProblem.afterFreeze) - getTotalPenalty(currentProblem.beforeFreeze));
           currentProblem.submitAfterFreeze = false;
           let newIndex = currentIndex;
           for (let i = currentIndex; i >= 0; i--) {
               if (standings[currentIndex].totalScore > standings[i].totalScore ||
                   (standings[currentIndex].totalScore == standings[i].totalScore && standings[currentIndex].totalTime < standings[i].totalTime)) {
                   newIndex = i;
               }
           }
           const user = standings.splice(currentIndex, 1)[0];
           standings.splice(newIndex, 0, user);
           for (let i = newIndex; i < standings.length; i++) {
               standings[i].rank = (i == 0 || !(standings[i].totalScore == standings[i - 1].totalScore && standings[i].totalTime == standings[i - 1].totalTime))
                   ? i + 1 : standings[i - 1].rank;
               teamBoxMap.get(standings[i].name).querySelector(".rank").textContent = standings[i].rank;
           }
           if (newIndex != currentIndex) {
               const savedCurrentIndex = currentIndex;
               for (let i = newIndex; i <= savedCurrentIndex; i++) {
                   teamAnimators.get(standings[i].name)?.setTarget(i);
               }
               clearTeamHighlight(teamBoxMap.get(standings[newIndex].name));
               teamBoxMap.get(standings[savedCurrentIndex].name).style.background = activeTeamColor;
               const nextUnfrozenIndex = getPendingProblemIndex(standings[currentIndex]);
               if (nextUnfrozenIndex == -1) { currentIndex--; currentAction = 0; }
               else { currentAction = 1; }
               setTimeout(resolve, auto ? resolverConfig.autoDelay : 0);
           } else {
               const nextUnfrozenIndex = getPendingProblemIndex(standings[currentIndex]);
               if (nextUnfrozenIndex == -1) { currentIndex--; currentAction = 0; }
               else { currentAction = 1; }
               setTimeout(resolve, auto ? resolverConfig.autoDelay : 0);
           }
       }
   });
}

let isRunning = false;
let isAuto = false;
async function runAutoLoop() {
   while (isAuto && (currentIndex >= 0 || currentAction == 0)) {
       isRunning = true;
       await run(true);
       isRunning = false;
   }
   isAuto = false;
   isRunning = false;
}

document.addEventListener("keydown", async function (event) {
   if (currentScreen == 1) {
       if (event.key == "Enter") {
           processContest();
       }
       return;
   }
   if (!isStarting) return;
   const key = event.key;
   if (key == "r" || key == "R") {
       isAuto = false;
       isRunning = false;
       processContest();
       return;
   }
   if (key == "a" || key == "A") {
       if (event.repeat) return;
       if (isAuto) {
           isAuto = false;
       } else {
           isAuto = true;
           runAutoLoop();
       }
       return;
   }
   if ((key == "n" || key == "N") && !isAuto && !isRunning) {
       if (isAnimating()) return;
       isRunning = true;
       await run();
       isRunning = false;
   }
});

window.addEventListener("DOMContentLoaded", () => {
   if (window.resolverConfig && window.resolverConfig.loadFromSession) {
       const data = sessionStorage.getItem("resolver_data");
       const config = sessionStorage.getItem("resolver_config");
       if (config) {
           resolverConfig = JSON.parse(config);
       }
       if (data) {
           let jsonDataElement = document.getElementById("json-data");
           if (!jsonDataElement) {
               jsonDataElement = document.createElement("textarea");
               jsonDataElement.id = "json-data";
               jsonDataElement.style.display = "none";
               document.body.appendChild(jsonDataElement);
           }
           jsonDataElement.value = data;
           const contestData = JSON.parse(data);
           const { contest, submissions } = contestData;
           let pendingSubmissions = 0;
           submissions.forEach(submission => {
               if (submission.submitMinutes >= contest.durationMinutes - contest.freezeDurationMinutes) {
                   pendingSubmissions++;
               }
           });
           const contestNameEl = document.getElementById("contest-name");
           if (contestNameEl) contestNameEl.textContent = contest.name;
           const splashPendingEl = document.getElementById("splash-pending");
           if (splashPendingEl) {
               const pendingLabel = (window.resolverConfig.labels && window.resolverConfig.labels.pendingSubmissions) || "pending submissions";
               splashPendingEl.textContent = pendingSubmissions + " " + pendingLabel;
           }
           const splashInstructionEl = document.getElementById("splash-instruction");
           if (splashInstructionEl) {
               const instructionLabel = (window.resolverConfig.labels && window.resolverConfig.labels.pressEnter) || "Press ENTER to start";
               splashInstructionEl.textContent = instructionLabel;
           }
           currentScreen = 1;
       }
   }
});