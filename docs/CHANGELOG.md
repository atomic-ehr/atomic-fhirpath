# Documentation Changelog

This file tracks significant changes to the documentation structure and content.

## [2025-07-11] - Major Documentation Reorganization

### Added
- Created new documentation structure with organized directories:
  - `overview/` - High-level documentation
  - `components/` - Component-specific documentation
  - `guides/` - How-to guides
  - `internals/` - Deep implementation details
  - `memory/` - AI assistant memory aids
- New documentation files:
  - `GETTING-STARTED.md` - Quick start guide for new users
  - `API-REFERENCE.md` - Complete API documentation
  - `memory/quick-reference.md` - Quick reference for AI assistants
  - `CHANGELOG.md` - This file
  - `GLOSSARY.md` - FHIRPath terms and concepts

### Changed
- Consolidated duplicate documentation:
  - Merged two `parser.md` files into `components/parser.md`
  - Merged two `compiler.md` files into `components/compiler.md`
- Reorganized existing files:
  - Moved `FHIRPATH-SUPPORT.md` → `overview/fhirpath-support.md`
  - Moved `PERFORMANCE.md` → `overview/performance.md`
  - Moved `roadmap.md` → `overview/roadmap.md`
  - Moved `overview.md` → `internals/parser-internals.md`
  - Moved `user-defined-functions.md` → `guides/user-defined-functions.md`
  - Moved `README_USER_DEFINED_FUNCTIONS.md` → `guides/custom-functions-guide.md`
  - Moved `gap-analysis.md` → `internals/gap-analysis.md`
- Updated `CLAUDE.md` with documentation usage instructions
- Completely rewrote `docs/README.md` with better navigation and structure

### Improved
- Added emojis and visual hierarchy to main README
- Created "Quick Links" table for common tasks
- Added clear separation between user docs and developer docs
- Enhanced navigation with descriptive links
- Improved documentation for both human readers and AI assistants

## [Previous] - Initial Documentation

### Initial Structure
- Basic documentation files in flat structure
- Component documentation in `components/` directory
- Design documents in `design/` directory
- Mixed user and developer documentation