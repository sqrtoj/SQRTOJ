window.MathJax = {
    tex: {
        inlineMath: [
            ['~', '~'],
            ['\\(', '\\)']
        ]
    },
    options: {
        enableMenu: false,
        enableSpeech: false,
        enableBraille: false
    },
    loader: {
        paths: {
            'mathjax-newcm': '/static/mathjax/mathjax-newcm/chtml/dynamic'
        }
    },
    output: {
        font: 'mathjax-newcm'
    }
};
