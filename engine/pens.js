/**
 * Lode Pens
 *
 * This module contains the various colored pens we use using the `chalk`
 * package in Lode.
 *
 */

///////////////////////////////////////////////////////////////////////////////
// Imports
//
// NOTE: all imports must be at the top of the file

// load chalk and erase
import chalk from 'chalk'
import erase from 'strip-ansi'
export { erase, chalk }

/////////////////////////////////////////////////////////////////////////
// Lode syntax highlighting

// Lode Color Theme
export const defaultPen = chalk.ansi256(12)        // Lode blue
export const metavariablePen = chalk.ansi256(3)    // orangish (also 220 is nice)
export const constantPen = chalk.ansi256(226)      // yellowish
export const instantiationPen = chalk.ansi256(8)   // dirt
export const hintPen = chalk.ansi256(93)           // purpleish
export const attributePen = chalk.ansi256(249)     // shade of grey
export const declaredPen = chalk.ansi256(212)      // pinkish
export const attributeKeyPen = chalk.ansi256(2)    // matches string green
export const checkPen = chalk.ansi256(46)          // bright green
export const starPen = chalk.ansi256(226)          // bright gold
export const xPen = chalk.ansi256(9)               // brightred
export const contextPen = chalk.ansi256(56)        // purpleish
export const decPen = chalk.ansi256(30)            // aqua-ish
export const commentPen = chalk.ansi256(252)       // light grey
export const headingPen = chalk.ansi256(226)       // bright Yellow
export const docPen = chalk.ansi256(248)           // light grey text
export const linenumPen = chalk.ansi256(22)        // darkish green
export const itemPen =  chalk.ansi256(214)         // orangish
export const stringPen =  chalk.ansi256(2)         // the green that node useds for strings
export const greyPen = chalk.rgb(130,130,130)      // the grey node uses for 'undefined'
// export const smallPen (maybe TODO some day) \u{1D5BA} is the code for small a

// compute once for efficiency
export const goldstar     = starPen('★')
export const redstar      = xPen('☆')
export const greencheck   = checkPen('✔︎')
export const redx         = xPen('✗')
export const inapplicable = '⊘'     
export const idunno       = '❓'  // the emoji itself is red
export const preemiex     = xPen('⁉︎') 

export default {
  
  // formatting utiltiies
  erase, chalk,
  
  // special symbols
  goldstar, redstar, greencheck, redx, idunno, preemiex, inapplicable,
  
  // Pens
  defaultPen, metavariablePen, constantPen, instantiationPen, hintPen,
  attributePen, attributeKeyPen, declaredPen, checkPen, starPen, xPen,
  contextPen, decPen, commentPen, headingPen, docPen, linenumPen, itemPen,
  stringPen, greyPen
  
}

/////////////////////////////////////////////