# Category Sequence Configuration

This directory contains configuration files for the Policy Analyzer application.

## Category Sequence

The `categorySequence.js` file reads the category sequence from environment variables to define the order in which sub-tabs appear in the main UI.

### Required Configuration:

Create a `.env` file in the root directory and add:
```
VITE_CATEGORY_SEQUENCE=Expense_Management,Air_Travel,Ground_Transportation,Group_&_Event_Travel,Hotel_Lodging,Meals_&_Entertainment,Overview_&_Guidelines,Risk_Management,Sustainability,Travel_Arrangements,Wellbeing,Group_&_Events_Travel
```

### How to Modify:

#### Option 1: Edit Environment Variable
Modify the `VITE_CATEGORY_SEQUENCE` value in your `.env` file

#### Option 2: Create Different .env Files
- `.env.development` for development
- `.env.production` for production
- `.env.local` for local overrides

### How It Works:
- The application reads the sequence from `VITE_CATEGORY_SEQUENCE` environment variable
- Files are sorted based on their position in the sequence
- Files not found in the sequence maintain their original order
- If no environment variable is set, files appear in their original order
- The matching is case-insensitive and ignores special characters

### Fallback Behavior:
- If `VITE_CATEGORY_SEQUENCE` is not defined: Files appear in original order
- If `VITE_CATEGORY_SEQUENCE` is empty: Files appear in original order
- If `VITE_CATEGORY_SEQUENCE` is malformed: Files appear in original order 