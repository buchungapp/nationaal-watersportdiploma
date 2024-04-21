pnpm run generate:schema
file_name=$(pnpm run generate:custom | grep -oE '\b\S+\.sql\b' | tail -1) && cat ./src/utils/rls.sql >> "$file_name"
