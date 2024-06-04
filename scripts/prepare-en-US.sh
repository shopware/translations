#!/usr/bin/env sh

pwd

if [ -n "${DEBUG:-}" ]; then
    set -x
fi

translations_folder_path="${PROJECT_ROOT}/translations"
parent_language_locale="en-GB"
target_language_locale="en-US"

parent_folder_path="$translations_folder_path/$parent_language_locale"
target_language_path="$translations_folder_path/$target_language_locale"
temp_target_language_path="$target_language_path-TEMP"

mv $target_language_path $temp_target_language_path
mkdir -p "$target_language_path"

find "$parent_folder_path" -name '*.json' | while read parent_file_path; do
    file_name=$(basename "$parent_file_path")
    relative_path=$(dirname "${parent_file_path#$parent_folder_path/}")
    temp_target_file_path="$temp_target_language_path/$relative_path/$file_name"
    target_current_path="$target_language_path/$relative_path"
    target_file_path="$target_current_path/$file_name"

    if [ -f "$temp_target_file_path" ]; then
        # Merge en-US snippet values into en-GB snippet key structure
        mkdir -p "$(dirname "$target_file_path")"
        jq --indent 4 -s '
            .[0] as $gb | .[1] as $us |
            reduce ($gb | paths(scalars)) as $path ($gb;
                getpath($path) as $value |
                if ($us | getpath($path)) then
                    setpath($path; $us | getpath($path))
                else
                  .
                end
            )
        ' "$parent_file_path" "$temp_target_file_path" > "$target_file_path"
    else
        # Copy en-GB snippets to en-US if not exists
        mkdir -p "$target_current_path"
        cp "$parent_file_path" "$target_file_path"
    fi
done

rm -rf $temp_target_language_path
