JSHINT="xargs -0 -I FILE node_modules/.bin/jshint FILE --show-non-errors"
JSHINT_NODE="$JSHINT --node"
JSHINT_TESTS="$JSHINT_NODE --predef describe it"
JSHINT_STATIC="$JSHINT --browser"

if [ $1 ]
then
  if echo -n $1 | grep -q 'static/'
  then
    echo -n $1 | $JSHINT_STATIC
  elif echo -n $1 | grep -q 'test/'
  then
    echo -n $1 | $JSHINT_TESTS
  else
    echo -n $1 | $JSHINT_NODE
  fi
  exit 0
fi

FIND_JS="find -name '*.js' ! -path './node_modules/*'"
STATIC="-path './static/*'"
TESTS="-path './test/*'"

sh -c "$FIND_JS ! $STATIC ! $TESTS -print0 | $JSHINT_NODE
$FIND_JS $TESTS -print0 | $JSHINT_TESTS
$FIND_JS $STATIC -print0 | $JSHINT_STATIC
