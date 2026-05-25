from abc import ABCMeta, abstractmethod
from django.db.models import Max


class abstractclassmethod(classmethod):
    __isabstractmethod__ = True

    def __init__(self, callable):
        callable.__isabstractmethod__ = True
        super(abstractclassmethod, self).__init__(callable)


class BaseContestFormat(metaclass=ABCMeta):
    has_hidden_subtasks = False

    @abstractmethod
    def __init__(self, contest, config):
        self.config = config
        self.contest = contest

    @property
    @abstractmethod
    def name(self):
        """
        Name of this contest format. Should be invoked with gettext_lazy.

        :return: str
        """
        raise NotImplementedError()

    @abstractclassmethod
    def validate(cls, config):
        """
        Validates the contest format configuration.

        :param config: A dictionary containing the configuration for this contest format.
        :return: None
        :raises: ValidationError
        """
        raise NotImplementedError()

    @abstractmethod
    def update_participation(self, participation):
        """
        Updates a ContestParticipation object's score, cumtime, and format_data fields based on this contest format.
        Implementations should call ContestParticipation.save().

        :param participation: A ContestParticipation object.
        :return: None
        """
        raise NotImplementedError()

    @abstractmethod
    def get_first_solves_and_total_ac(self, problems, participations, frozen=False):
        """
        Returns two dictionaries mapping ContestProblem to the first ContestParticipation that solves it
        and the total number of accepted submissions.

        :param problems: A list of ContestProblem objects.
        :param participations: A list of ContestParticipation objects.
        :param frozen: Whether the ranking is frozen or not. Only useful for ICPC/VNOJ format.
        :return: A tuple of two dictionaries. First one maps ContestProblem's ID to ContestParticipation's ID,
        or None if no solves yet. Second one maps ContestProblem's ID to total number of accepted submissions.
        """
        raise NotImplementedError()

    @abstractmethod
    def display_user_problem(self, participation, contest_problem, first_solves, frozen=False):
        """
        Returns the HTML fragment to show a user's performance on an individual problem. This is expected to use
        information from the format_data field instead of computing it from scratch.

        :param participation: The ContestParticipation object linking the user to the contest.
        :param contest_problem: The ContestProblem object representing the problem in question.
        :param first_solves: The first dictionary returned by get_first_solves_and_total_ac.
        :param frozen: Whether the ranking is frozen or not. Only useful for ICPC/VNOJ format.
        :return: An HTML fragment, marked as safe for Jinja2.
        """
        raise NotImplementedError()

    @abstractmethod
    def display_participation_result(self, participation, frozen=False):
        """
        Returns the HTML fragment to show a user's performance on the whole contest. This is expected to use
        information from the format_data field instead of computing it from scratch.

        :param participation: The ContestParticipation object.
        :param frozen: Whether the ranking is frozen or not. Only useful for ICPC/VNOJ format.
        :return: An HTML fragment, marked as safe for Jinja2.
        """
        raise NotImplementedError()

    @abstractmethod
    def get_problem_breakdown(self, participation, contest_problems):
        """
        Returns a machine-readable breakdown for the user's performance on every problem.

        :param participation: The ContestParticipation object.
        :param contest_problems: The list of ContestProblem objects to display performance for.
        :return: A list of dictionaries, whose content is to be determined by the contest system.
        """
        raise NotImplementedError()

    @abstractmethod
    def get_label_for_problem(self, index):
        """
        Returns the problem label for a given zero-indexed index.

        :param index: The zero-indexed problem index.
        :return: A string, the problem label.
        """
        raise NotImplementedError()

    @abstractmethod
    def get_short_form_display(self):
        """
        Returns a generator of Markdown strings to display the contest format's settings in short form.

        :return: A generator, where each item is an individual line.
        """
        raise NotImplementedError()

    @classmethod
    def best_solution_state(cls, points, total):
        if not points:
            return 'failed-score'
        if points == total:
            return 'full-score'
        return 'partial-score'

    def handle_frozen_state(self, participation, format_data):
        hidden_subtasks = {}
        if hasattr(self, "get_hidden_subtasks"):
            hidden_subtasks = self.get_hidden_subtasks()

        queryset = participation.submissions.values("problem_id").annotate(
            time=Max("submission__date")
        )
        for result in queryset:
            problem = str(result["problem_id"])
            if format_data.get(problem):
                is_after_freeze = (
                    self.contest.freeze_after and
                    result["time"] >= self.contest.freeze_after + participation.start
                )
                if is_after_freeze or hidden_subtasks.get(problem):
                    format_data[problem]["frozen"] = True
            else:
                format_data[problem] = {"time": 0, "points": 0, "frozen": True}

    def get_hidden_subtasks(self):
        return {}

    def get_results_by_subtask(self, participation, frozen=False):
        contest_problems = self.contest.contest_problems.all()
        for cp in contest_problems:
            subs = cp.submissions.filter(participation=participation)
            if frozen and participation.contest.frozen_last_minutes != 0:
                frozen_time = participation.contest.frozen_time
                subs = subs.filter(submission__date__lt=frozen_time)

            best_cs = subs.order_by('-points', 'submission__date').first()
            if not best_cs:
                continue

            testcases = list(best_cs.submission.test_cases.all())
            if not testcases:
                yield (cp.id, cp.points, 0, 0, cp.points, 1, best_cs.submission.id)
                continue

            has_batches = any(tc.batch is not None for tc in testcases)
            if has_batches:
                batches = {}
                for tc in testcases:
                    b = tc.batch if tc.batch is not None else 1
                    if b not in batches:
                        batches[b] = []
                    batches[b].append(tc)
                for b, cases in batches.items():
                    subtask_points = min(c.points or 0.0 for c in cases) if cases else 0
                    total_subtask_points = min(c.total or 0.0 for c in cases) if cases else 0
                    yield (cp.id, cp.points, 0, subtask_points, total_subtask_points, b, best_cs.submission.id)
            else:
                subtask_points = sum(tc.points or 0.0 for tc in testcases)
                total_subtask_points = sum(tc.total or 0.0 for tc in testcases)
                if total_subtask_points == 0:
                    total_subtask_points = cp.points
                yield (cp.id, cp.points, 0, subtask_points, total_subtask_points, 1, best_cs.submission.id)
