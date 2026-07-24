from django.test import TestCase
from django.urls import reverse

from judge.models import BlogVote
from judge.models.tests.util import CommonDataMixin, create_blogpost, create_user


class BlogPostTestCase(CommonDataMixin, TestCase):
    @classmethod
    def setUpTestData(self):
        super().setUpTestData()
        self.users.update({
            'staff_blogpost_edit_own': create_user(
                username='staff_blogpost_edit_own',
                is_staff=True,
                user_permissions=('change_blogpost',),
            ),
            'staff_blogpost_edit_all': create_user(
                username='staff_blogpost_edit_all',
                is_staff=True,
                user_permissions=('change_blogpost', 'edit_all_post'),
            ),
            'org_member': create_user(
                username='org_member',
            ),
        })

        self.users['staff_organization_admin'].profile.organizations.add(self.organizations['open'])
        self.users['org_member'].profile.organizations.add(self.organizations['open'])

        self.basic_blogpost = create_blogpost(
            title='basic',
            authors=('staff_blogpost_edit_own',),
        )

        self.visible_blogpost = create_blogpost(
            title='visible',
            visible=True,
        )

        self.visible_blogpost_in_org = create_blogpost(
            title='visible_org',
            visible=True,
            global_post=False,
            organization=self.organizations['open'],
            authors=('staff_organization_admin',),
        )

        self.non_visible_blogpost_in_org = create_blogpost(
            title='non_visible_org',
            visible=False,
            global_post=False,
            organization=self.organizations['open'],
            authors=('staff_organization_admin',),
        )

    def test_basic_blogpost(self):
        self.assertEqual(str(self.basic_blogpost), self.basic_blogpost.title)

    def test_basic_blogpost_methods(self):
        data = {
            'superuser': {
                'can_see': self.assertTrue,
                'is_editable_by': self.assertTrue,
            },
            'staff_blogpost_edit_own': {
                'can_see': self.assertTrue,
                'is_editable_by': self.assertTrue,
            },
            'staff_blogpost_edit_all': {
                'can_see': self.assertTrue,
                'is_editable_by': self.assertTrue,
            },
            'normal': {
                'can_see': self.assertFalse,
                'is_editable_by': self.assertFalse,
            },
            'anonymous': {
                'can_see': self.assertFalse,
                'is_editable_by': self.assertFalse,
            },
        }
        self._test_object_methods_with_users(self.basic_blogpost, data)

    def test_blog_vote_can_switch_direction(self):
        self.client.force_login(self.users['staff_problem_edit_own'])

        response = self.client.post(reverse('blog_upvote'), {'id': self.visible_blogpost.id})
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {'score': 1, 'vote_score': 1})

        response = self.client.post(reverse('blog_downvote'), {'id': self.visible_blogpost.id})
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {'score': -1, 'vote_score': -1})
        self.assertEqual(BlogVote.objects.get(blog=self.visible_blogpost,
                                              voter=self.users['staff_problem_edit_own'].profile).score, -1)

        response = self.client.post(reverse('blog_downvote'), {'id': self.visible_blogpost.id})
        self.assertEqual(response.status_code, 400)

    def test_visible_blogpost_methods(self):
        data = {
            'superuser': {
                'can_see': self.assertTrue,
                'is_editable_by': self.assertTrue,
            },
            'staff_blogpost_edit_own': {
                'can_see': self.assertTrue,
                'is_editable_by': self.assertFalse,
            },
            'normal': {
                'can_see': self.assertTrue,
                'is_editable_by': self.assertFalse,
            },
            'anonymous': {
                'can_see': self.assertTrue,
                'is_editable_by': self.assertFalse,
            },
        }
        self._test_object_methods_with_users(self.visible_blogpost, data)

    def test_visible_blogpost_in_org(self):
        data = {
            'superuser': {
                'can_see': self.assertTrue,
                'is_editable_by': self.assertTrue,
            },
            # Not in org
            'normal': {
                'can_see': self.assertFalse,
                'is_editable_by': self.assertFalse,
            },
            'anonymous': {
                'can_see': self.assertFalse,
                'is_editable_by': self.assertFalse,
            },
            'org_member': {
                'can_see': self.assertTrue,
                'is_editable_by': self.assertFalse,
            },
            'staff_organization_admin': {
                'can_see': self.assertTrue,
                'is_editable_by': self.assertTrue,
            },
        }
        self._test_object_methods_with_users(self.visible_blogpost_in_org, data)

    def test_non_visible_blogpost_in_org(self):
        data = {
            'superuser': {
                'can_see': self.assertTrue,
                'is_editable_by': self.assertTrue,
            },
            # Not in org
            'normal': {
                'can_see': self.assertFalse,
                'is_editable_by': self.assertFalse,
            },
            'anonymous': {
                'can_see': self.assertFalse,
                'is_editable_by': self.assertFalse,
            },
            'org_member': {
                'can_see': self.assertFalse,
                'is_editable_by': self.assertFalse,
            },
            'staff_organization_admin': {
                'can_see': self.assertTrue,
                'is_editable_by': self.assertTrue,
            },
        }
        self._test_object_methods_with_users(self.non_visible_blogpost_in_org, data)
