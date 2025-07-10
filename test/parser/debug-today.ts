import { Tokenizer } from '../../src/tokenizer';

const tokenizer = new Tokenizer();

const exprs = [
  '18 years',
  '5 minutes',
  '10.5 hours',
  '18',
  'years'
];

for (const expr of exprs) {
  tokenizer.reset(expr);
  console.log(`\nTokenizing: "${expr}"`);
  
  let token = tokenizer.nextToken();
  while (token.type !== 0) { // EOF
    console.log(`  Token: type=${token.type}, value="${token.value}"`);
    token = tokenizer.nextToken();
  }
}