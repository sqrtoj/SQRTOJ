from django.core.cache import cache
from django.test import TestCase, override_settings

from judge.jinja2.gravatar import gravatar
from judge.models.tests.util import create_user
from judge.views.blog import _get_cached_top_contributors, _get_cached_top_rated_users


@override_settings(
    CACHES={
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'homepage-leaderboard-tests',
        },
    },
    VNOJ_HOMEPAGE_TOP_USERS_COUNT=5,
)
class HomepageLeaderboardTestCase(TestCase):
    fixtures = ['language_all.json']

    def setUp(self):
        cache.clear()
        for index in range(5):
            user = create_user(
                username='leaderboard%d' % index,
                email='leaderboard%d@example.com' % index,
            )
            profile = user.profile
            profile.rating = 2000 - index
            profile.contribution_points = 100 - index
            profile.mute = index % 2 == 0
            profile.save(update_fields=['rating', 'contribution_points', 'mute'])

    def assert_gravatars_do_not_fetch_deferred_fields(self, producer):
        with self.assertNumQueries(1):
            profiles = producer()

        with self.assertNumQueries(0):
            for profile in profiles:
                gravatar(profile, 40)

        with self.assertNumQueries(0):
            producer()

    def test_top_rated_users_include_gravatar_fields(self):
        self.assert_gravatars_do_not_fetch_deferred_fields(_get_cached_top_rated_users)

    def test_top_contributors_include_gravatar_fields(self):
        self.assert_gravatars_do_not_fetch_deferred_fields(_get_cached_top_contributors)
