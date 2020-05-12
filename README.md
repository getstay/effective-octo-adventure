# TODO: name this

There's a walkthrough in `./docs/`.

I frequently run selective tests like this:

```sh
# specific test file in the current directory
npm test --file="$PWD/name.spec.js

# all test files in the current directory
npm test --file="$PWD/*.spec.js"
```
