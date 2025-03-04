# -*- coding: utf-8 -*-
"""
Created on Tue Feb 25 17:33:49 2025

@author: shuvr
"""

def compare_strings(string1, string2):
    
    # Initialize two strings.
    string1 = "Hello world"
    string2 = "Let's learn java"
    
    # Get the input strings from the user.
    string1 = input("Enter the first string: ")
    string2 = input("Enter the second string: ")
    
    # Compare both the strings.
    if string1 == string2:
        print("The strings are equal. ")
    else:
        print("The strings are not equal. ")
    
    if string1 < string2:
       print(string1 + " comes before " + string2)
    elif string1 > string2:
       print(string1 + " comes after " + string2)
    else:
        print(string1 + " and " + string2 + " are the same ")  
