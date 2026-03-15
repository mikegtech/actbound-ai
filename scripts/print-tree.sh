#!/usr/bin/env sh

find . \
  -path "./.git" -prune -o \
  -path "./node_modules" -prune -o \
  -type f \
  | sort
