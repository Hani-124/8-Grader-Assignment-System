from django.urls import path
from . import views


urlpatterns = [
    path('upload/', views.upload_file, name='upload'),
    path('download/<str:filename>/', views.download_file, name='download'),
    path('get-csrf/', views.get_csrf, name='get_csrf'),
]
