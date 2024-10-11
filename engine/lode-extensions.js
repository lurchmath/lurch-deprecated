
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

/** 
 * Return an array showing all of the js attributes and LC attributes of this
 * LC, except for those whose key begins with an underscore '_'.
 *
 * @memberof Extensions
 * @return {Array} - the array of key-value pairs
 */
LogicConcept.prototype.attributes = function ( ) {
    return [ 
        ...Object.keys(this).filter(x=> x[0]!=='_').map( key => [key,this[key]]),
        ...this.getAttributeKeys().map( key => [key,this.getAttribute(key)])  
    ]
}

//  A utilty function to inspect the contents of an LC in the console in a nice
// format. 
LogicConcept.prototype.inspect = function(x) { 
    console.log(util.inspect(x , depth = 1) , 
    { customInspect: false , showHidden: false , depth: depth , colors: true } ) 
}
LogicConcept.prototype.inspect = function(...args) { inspect(this,...args) }

/** 
 * Compute the array of all Insts's in this LC. 
 * 
 * @memberof Extensions
 */
LogicConcept.prototype.Insts = function () {
    return [...this.descendantsSatisfyingIterator( x => x.isA('Inst') )]
}
  
/** 
 * Compute the array of all Parts's in this LC. 
 * 
 * @memberof Extensions
 */
LogicConcept.prototype.Parts = function () {
    return [...this.descendantsSatisfyingIterator( x => x.isA('Part') )]
}

/**
 * Compute the array of all ForSomes's in this LC.  If the argument is true,
 * only return those with bodies.
 * 
 * @memberof Extensions
 */
LogicConcept.prototype.forSomes = function ( onlyWithBodies ) {
    return [ ...this.descendantsSatisfyingIterator( x => 
        x instanceof Declaration && !x.isA('given') && 
        !x.isA('Declare') && (!onlyWithBodies || x.body())
    ) ]
}

/** 
 * Compute the array of all environments in this LC. 
 * 
 * @memberof Extensions
 */
LogicConcept.prototype.environments = function () {
    // this is effectively the same code as for .conclusions
    let ans = [ ]
    this.children().forEach( child => {
      if (!(child instanceof Environment)) return
      ans.push( child ) // it's an environment
      ans = ans.concat( child.environments() )    
    })
    return ans  
}

/** 
 * Compute the array of all bindings in this LC 
 * 
 * @memberof Extensions
 */
LogicConcept.prototype.bindings = function () {
    let ans = [ ]
    if (this instanceof BindingExpression) ans.push( this )
    this.children().forEach( child => 
        ans = ans.concat( child.bindings() )    
    )
    return ans  
}
