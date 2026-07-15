from django.utils.translation import gettext as _, gettext_lazy

from judge.contest_format.registry import register_contest_format
from judge.contest_format.vnoj import VNOJContestFormat


@register_contest_format('voi')
class VOIContestFormat(VNOJContestFormat):
    name = gettext_lazy('VOI')
    """
    VOI-style contest format.

    Behaves exactly like the VNOJ format (max-score-per-problem, penalty, optional
    last-submission-only, and a frozen scoreboard for the last X minutes), but is a
    distinct selectable format so organizers can pair it with a
    "hidden until the contest ends" scoreboard visibility to reproduce the VOI
    experience: results stay hidden/frozen until they are officially published.

    All scoring/freezing logic is inherited from VNOJContestFormat; only the
    human-facing rules summary differs so contestants understand the freeze.
    """

    def get_short_form_display(self):
        # Reuse the VNOJ rules (max score, penalty, tiebreak, freeze window)...
        yield from super().get_short_form_display()

        # ...then make the "results hidden until published" nature explicit.
        yield _('Results stay hidden/frozen until they are officially published '
                'after the contest ends.')
