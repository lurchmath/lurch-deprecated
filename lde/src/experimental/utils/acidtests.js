////////////////////////////////////////////////////////////////////////////
// WARNING: putting let or const in front of a definition will cause it to 
// be local to the init file and not exported to the Lode global.  Don't use
// const or let for things you want to export.
////////////////////////////////////////////////////////////////////////////
// opening
process.stdout.write(defaultPen(`Loading the acid tests ...\n\n`))
let start = Date.now()
////////////////////////////////////////////////////////////////////////////

const DEBUG = false
acid=[]
const loadtest = (name, folder='acid tests', extension='lurch',
                  language='lurch', desc = '') => { 
  if (DEBUG) console.log(`loading acid test ${folder}/${name}`)
  try {
    let a = loadDoc(name,`proofs/${folder}`, extension, language)
    if (desc) a.desc=desc
    acid.push(a) 
  } catch {
    console.log(`Error loading acid test: ${name}`)
    acid.push(xPen(`Error loading acid test: ${name}`))
  }
}

// Load Acid Tests
Array.seq(k=>k,0,13).forEach( k => loadtest(`acid ${k}`) )
// Load other tests in the acid tests folder
loadtest('Transitive Chains')
loadtest('Cases')
loadtest('BIH Cases')
loadtest('user-thms')
loadtest('ArithmeticNatural')
loadtest('ArithmeticInteger')
loadtest('ArithmeticRational')
// Load Math 299 tests
loadtest('prop','math299')
loadtest('pred','math299')
loadtest('peanoBIH','math299')
loadtest('peano','math299')
loadtest('midterm','math299')
loadtest('recursion','math299')
loadtest('reals','math299')
loadtest('sets','math299')
loadtest('test','math299','txt','putdown','student assignment')
loadtest('inapplicable','math299','txt','putdown','testing an inapplicable')

// run the tests
let passed = 0
let failed = 0

// test the asciimath Peggy parser by itself
try { 
  const s=lc(parse(loadStr('parsers/LurchParserTests')))
  passed++
  console.log(`${itemPen('Parser Test:')} → ok`)
} catch (e) { 
  failed++
  console.log(xPen(`ERROR: asciimath peggy parser test failed.`)) 
}

// and the rest of the acid tests
let numchecks = 0
let numreds = 0

acid.forEach( (T,k) => {
  if (typeof T === 'string') { write(T) ; failed++; return }
  // for each test, if a description was provided, use that, otherwise find the first comment, if any, in the test file.
  desc = T.desc || T.find(x=>x.isAComment())?.child(1) || ''
  console.log((itemPen(`Test ${k}: ${stringPen(desc)}`)))

  T.descendantsSatisfying( x => x.ExpectedResult).forEach( (s,i) => {
    if ((Validation.result(s) && 
          (Validation.result(s).result==s.ExpectedResult ||
          // handle the inapplicable arithmetic case
          s.results('arithmetic')?.result==s.ExpectedResult)
          ) ||
          // handle the redeclared variable case
          (s.getAttribute('scope errors')?.redeclared && s.ExpectedResult=='invalid') 
      ) { 
        console.log(`  Test ${k}.${i} → ok`)
        passed++
    } else {
      console.log(xPen(`\n  Test ${k}.${i} → FAIL!!\n`))
      write(s)
      write(`at address ${s.address()}`)
      failed++
    }
  })
  T.descendantsSatisfying( x => {
    result = x.getAttribute('validation result')?.result
    if (result==='valid') ++numchecks  
    if ( result==='indeterminate' || result==='invalid' ) ++numreds
  })
})

const pen = (!failed) ? chalk.ansi256(40) : chalk.ansi256(9)
console.log(pen(`\n${passed} tests passed - ${failed} tests failed\n`))
console.log(
  `${checkPen(numchecks)} green checks\n${checkPen(numreds)} red marks`)

console.log(`Test result stored in the array 'acid'\n`)

// acid.forEach((x,k)=>{console.log('\nTest #'+k+'\n');x.report(user)})

///////////////////////////////////////////////////////////
// closing    
console.log(defaultPen(`done! (${(Date.now()-start)} ms)`))
// don't echo anything
undefined
///////////////////////////////////////////////////////////