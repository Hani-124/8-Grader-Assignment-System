from django.urls import path
from .views import (
    ResumeCourseProcessingAPI,
    SimpleFileUploadAPI,
    SaveEditedAssignmentsAPIView,
    MatchResultsAPIView,
    ScrapeCoursesView
)

urlpatterns = [
    path('api/process/', ResumeCourseProcessingAPI.as_view(), name='resume-course-processor'),
    path('api/upload/', SimpleFileUploadAPI.as_view(), name='simple-upload'),
    path('api/update-grader-data/', SaveEditedAssignmentsAPIView.as_view(), name='save-edits'),
    path('api/match-results/', MatchResultsAPIView.as_view(), name='match-results'),
    path('api/scrape-courses/', ScrapeCoursesView.as_view(), name='scrape-courses'),
]
