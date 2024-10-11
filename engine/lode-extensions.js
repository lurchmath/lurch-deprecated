
import { LogicConcept } from '../core/src/logic-concept.js'
import { CNFProp } from './CNFProp.js'

/**
 * See the [Global Propositional Form tutorial]{@tutorial Propositional Form} for
 * details. Convert an LC to its algebraic propositional form. Modes are the
 * strings `'raw'`, `'simplify'`, or `'cnf'`. The 'raw' mode just converts t he
 * LC to algebraic form. The 'simplify' mode distributes negations by DeMorgan.
 * The 'cnf' mode expands all the way to cnf. 
 *
 * @memberof Extensions
 * @param {'raw'|'simplify'|'cnf'} [mode='raw'] - the mode
 * @param {LogicConcept} [target=this] - the target
 * @param {boolean} [checkPreemies=false] - if true, check for preemies
 */
LogicConcept.prototype.toAlgebraic = function ( 
    mode = 'raw' , target=this , checkPreemies = false
) { 
    let cat = this.catalog()
    let raw = CNFProp.fromLC(this,cat,target,checkPreemies)
    if (mode==='raw') { return raw.toAlgebraic() }
    let simp = raw.simplify()
    if (mode==='simplify') { return simp.toAlgebraic() }
    // otherwise mode must be 'cnf' 
    let n = cat.length
    return CNFProp.cnf2Algebraic( CNFProp.toCNF(simp,{num:n}) , n )
}
  
/**
 * See the [Global Propositional Form tutorial]{@tutorial Propositional Form} for
 * details. Convert an LC to its English propositional form.
 *
 * @memberof Extensions
 * @param {LogicConcept} [target=this] - the target
 * @param {boolean} [checkPreemies=false] - if true, check for preemies
 */
LogicConcept.prototype.toEnglish = function ( target = this, checkPreemies = false ) { 
    let cat = this.catalog()
    return CNFProp.fromLC(this,cat,target,checkPreemies).toEnglish(cat)
}
  
/**
 * Produces a string representation of this LC's propositional form in a nice
 * format that is useful for viewing it in Lode or a console.
 *
 * @memberof Extensions
 * @param {LogicConcept} [target=this] - the target
 * @param {boolean} [checkPreemies=false] - if true, check for preemies
 */
LogicConcept.prototype.toNice = function ( target = this, checkPreemies = false ) { 
    let cat = this.catalog()
    return say(stringPen(CNFProp.fromLC(this,cat,target,checkPreemies).toNice(cat)))
}
