# echo/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('echo/', views.echo_view, name='echo'),
]
