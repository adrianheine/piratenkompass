FIND_JS="find -name '*.js' ! -path './node_modules/*'"
STATIC="-path './static/*'"
TESTS="-path './test/*'"
JSHINT="xargs -0 -I FILE node_modules/.bin/jshint FILE --show-non-errors"

sh -c "$FIND_JS ! $STATIC ! $TESTS -print0 | $JSHINT --node
$FIND_JS $TESTS -print0 | $JSHINT --node # --predef describe it
$FIND_JS $STATIC -print0 | $JSHINT --browser"
