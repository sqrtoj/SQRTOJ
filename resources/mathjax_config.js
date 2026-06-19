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
    chtml: {
        fontURL: '/static/mathjax/mathjax-newcm/woff2',
        dynamicPrefix: '/static/mathjax/mathjax-newcm/dynamic'
    },
    loader: {
        paths: {
            'mathjax-newcm': '/static/mathjax/mathjax-newcm'
        },
        pathFilters: [
            function (data) {
                if (data.name.indexOf('[mathjax-newcm]/chtml/dynamic/') === 0) {
                    data.name = data.name.replace('[mathjax-newcm]/chtml/dynamic/', '[mathjax-newcm]/dynamic/');
                }
                return true;
            }
        ]
    },
    output: {
        font: 'mathjax-newcm'
    }
};

