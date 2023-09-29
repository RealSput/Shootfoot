const colors = require('@colors/colors/safe');
const prompt = require('prompt-sync')();
const fs = require('fs');

let ip = 0;
let instrl = 0;

(async () => {
let logUpdate = await import('log-update');
logUpdate = logUpdate.default;

const characters =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';

let unpr = false;
function bruteforce(length, cond, cb, log = true) {
  if (unpr && debug) {
    unpr = true;
    console.log('')
  }
  let f_am = [];
  let st = false;
  const base = characters.length;
  let count = BigInt(0);

  function generate(currentCombination) {
    if (log) logUpdate('CURRENT GUESS:', currentCombination, `(instruction ${ip + 1}/${instrl}, "${program[ip].join(' ')}")`)

    if (currentCombination.length === length) {
      if (cond(currentCombination)) {
        cb(count);
        st = true;
      }
      return;
    }

    for (let i = 0; i < base; i++) {
      if (!st) {
        generate(currentCombination + characters[i]);
        count++;
      }
    }

    delete currentCombination;
  }

  generate('');
  unpr = true;
  return f_am;
}

let parse = (c) => c.split('\n').map(x => x.match(/(?:[^\s"']+|['"][^'"]*["'])+/g).map(x => {
  if ((x.startsWith("'") && x.endsWith("'")) || (x.startsWith('"') && x.endsWith('"'))) {
    return x.slice(1, -1)
  } else {
    if (!isNaN(parseInt(x))) return parseInt(x);
    return x;
  }
}))

let defs = {};
if (!process.argv[2]) {
  console.log(colors.red("Shootfoot ERR: Argument 1 must be a file, got nothing"));
  return;
}
let program = parse(fs.readFileSync(process.argv[2]).toString());
let ed_program = [...program].map(x => [...x]);

instrl = ed_program.length;
console.time('Finished in');

let debug = false;

while (ip <= ed_program.length - 1) {
  let i = ed_program[ip];
  await new Promise((resolve) => {
  let instruction = i.shift();
  switch(instruction) {
    case 'def':
      let str = ed_program[ip].shift();
      bruteforce(str.length, (x) => x == str, (count) => {
        defs[count] = i.shift();
        resolve(true);
      }, debug);
    break;
    case 'print':
      let variable = ed_program[ip].shift();
      bruteforce(variable.length, (x) => x == variable, (count) => {
        console.log(defs[count])
        resolve(true);
      }, debug);
    break;
      case 'add':
      let add_a = ed_program[ip].shift(); // the variable that will hold the result
      let add_b = ed_program[ip].shift(); // the variable that will be added to A
      bruteforce(add_a.length, (x) => x == add_a, (a_def) => {
        bruteforce(add_b.length, (x) => x == add_b, (b_def) => {
          defs[a_def] = defs[a_def] + defs[b_def];
          resolve(true);
        }, debug);
      }, debug);
    break;
    case 'mul':
      let mul_a = ed_program[ip].shift(); // the variable that will hold the result
      let mul_b = ed_program[ip].shift(); // the variable that will be added to A
      bruteforce(mul_a.length, (x) => x == mul_a, (a_def) => {
        bruteforce(mul_b.length, (x) => x == mul_b, (b_def) => {
          defs[a_def] = defs[a_def] * defs[b_def];
          resolve(true);
        }, debug);
      }, debug);
    break;
    case 'input':
      let prstr = ed_program[ip].shift();
      let n = prompt(prstr);
      n = isNaN(parseInt(n)) ? n : parseInt(n);
      let inpv = ed_program[ip].shift(); // the variable that will hold the result
      bruteforce(inpv.length, (x) => x == inpv, (v_def) => {
        defs[v_def] = n;
        resolve(true);
      }, debug);
    break;
  }
  ip++;
})
}
console.log('-'.repeat(75))
console.timeEnd('Finished in')
})();