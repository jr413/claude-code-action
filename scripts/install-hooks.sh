#!/bin/bash

# Install git hooks to prevent common mistakes

HOOK_DIR=".git/hooks"
CUSTOM_HOOK_DIR=".github/hooks"

echo "🚀 Installing git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p "$HOOK_DIR"

# Install pre-commit hook
if [ -f "$CUSTOM_HOOK_DIR/pre-commit" ]; then
    cp "$CUSTOM_HOOK_DIR/pre-commit" "$HOOK_DIR/pre-commit"
    chmod +x "$HOOK_DIR/pre-commit"
    echo "✅ Pre-commit hook installed"
else
    echo "❌ Pre-commit hook not found in $CUSTOM_HOOK_DIR"
fi

# Install existing pre-push hook
if [ -f "scripts/pre-push" ]; then
    cp "scripts/pre-push" "$HOOK_DIR/pre-push"
    chmod +x "$HOOK_DIR/pre-push"
    echo "✅ Pre-push hook installed"
fi

echo ""
echo "🎉 Git hooks installed successfully!"
echo ""
echo "Pre-commit hook will check:"
echo "  ✓ Prettier formatting"
echo "  ✓ TypeScript types"
echo "  ✓ Unwanted files"
echo "  ✓ Unauthorized dependencies"
echo ""
echo "Pre-push hook will check:"
echo "  ✓ Tests pass"
echo "  ✓ Code quality"
echo ""
echo "To bypass hooks in emergency (NOT recommended):"
echo "  git commit --no-verify"