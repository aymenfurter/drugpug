
#shell script to trim away the sharp sign

for f in ./*\#*; do
    echo mv -n "$f" "${f%%\#*}"
done
