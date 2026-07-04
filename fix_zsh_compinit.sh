#!/bin/bash

# Fix zsh compinit insecure directories warning

ZSHRC="$HOME/.zshrc"

# Check if .zshrc exists
if [ ! -f "$ZSHRC" ]; then
    echo "Creating .zshrc file..."
    touch "$ZSHRC"
fi

# Check if the fix is already applied
if grep -q "compinit -u" "$ZSHRC"; then
    echo "Fix already applied to .zshrc"
    exit 0
fi

# Add the compinit fix to .zshrc
echo "" >> "$ZSHRC"
echo "# Fix zsh compinit insecure directories warning" >> "$ZSHRC"
echo "autoload -Uz compinit" >> "$ZSHRC"
echo "compinit -u" >> "$ZSHRC"

echo "Fix applied successfully!"
echo "Please restart your terminal or run: source ~/.zshrc"