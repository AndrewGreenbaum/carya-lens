#!/bin/bash

# Copy the manual test script to clipboard for easy pasting into Chrome DevTools

echo "📋 Copying LinkedIn scraper test to clipboard..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    cat test/linkedin-scraper-manual.js | pbcopy
    echo "✅ Test script copied to clipboard (macOS)"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xclip &> /dev/null; then
        cat test/linkedin-scraper-manual.js | xclip -selection clipboard
        echo "✅ Test script copied to clipboard (Linux - xclip)"
    elif command -v xsel &> /dev/null; then
        cat test/linkedin-scraper-manual.js | xsel --clipboard
        echo "✅ Test script copied to clipboard (Linux - xsel)"
    else
        echo "❌ Error: xclip or xsel not found. Install with: sudo apt-get install xclip"
        exit 1
    fi
else
    echo "❌ Error: Unsupported OS. Please manually copy test/linkedin-scraper-manual.js"
    exit 1
fi

echo ""
echo "📍 Next steps:"
echo "   1. Open LinkedIn profile or company page in Chrome"
echo "   2. Open DevTools (Cmd+Option+I or F12)"
echo "   3. Go to Console tab"
echo "   4. Paste (Cmd+V or Ctrl+V) and press Enter"
echo ""
echo "📖 See test/MANUAL_TEST_INSTRUCTIONS.md for detailed instructions"
