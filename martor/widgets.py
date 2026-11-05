from django import forms
from django.contrib.admin import widgets
from django.template.loader import get_template

from .settings import (
    MARTOR_ENABLE_CONFIGS,
    MARTOR_MARKDOWNIFY_URL,
    MARTOR_SEARCH_USERS_URL,
    MARTOR_UPLOAD_URL,
)


class MartorWidget(forms.Textarea):
    """Markdown editor widget powered by Ace."""

    UPLOADS_ENABLED = False

    def render(self, name, value, attrs=None, renderer=None, **kwargs):
        passed_attrs = attrs.copy() if attrs else {}

        default_attrs = {
            'data-enable-configs': MARTOR_ENABLE_CONFIGS,
            'data-upload-url': MARTOR_UPLOAD_URL,
            'data-markdownfy-url': MARTOR_MARKDOWNIFY_URL,
            'data-markdownify-url': MARTOR_MARKDOWNIFY_URL,
            'data-search-users-url': MARTOR_SEARCH_USERS_URL,
        }

        current_classes = passed_attrs.get('class', '').split()
        if 'martor' not in current_classes:
            current_classes.append('martor')
        passed_attrs['class'] = ' '.join(current_classes)

        attributes_to_pass = {**default_attrs, **passed_attrs, **self.attrs}
        widget_html = super().render(name, value, attributes_to_pass, renderer=renderer, **kwargs)

        template = get_template('martor/editor.html')
        mentions_enabled = MARTOR_ENABLE_CONFIGS.get('mention') == 'true'

        return template.render({
            'martor': widget_html,
            'field_name': name,
            'mentions_enabled': mentions_enabled,
            'uploads_enabled': self.UPLOADS_ENABLED,
        })

    class Media:
        css = {
            'all': (
                'plugins/css/ace.min.css',
                'plugins/css/semantic.css',
                'plugins/css/resizable.min.css',
            ),
        }
        js = (
            'plugins/js/ace.js',
            'plugins/js/semantic.min.js',
            'plugins/js/mode-markdown.js',
            'plugins/js/ext-language_tools.js',
            'plugins/js/theme-github.js',
            'plugins/js/theme-twilight.js',
            'plugins/js/highlight.min.js',
            'plugins/js/resizable.min.js',
            'martor/js/martor.js',
        )


class AdminMartorWidget(MartorWidget, widgets.AdminTextareaWidget):
    """Admin textarea variant for Martor."""

    pass
