/**
 * This namespace contains extensions of the LogicConcept class and several of
 * its subclasses that are needed or useful for n-compact validation.
 *
 * @namespace Extensions 
 */
// imports
import { LogicConcept } from '../core/src/logic-concept.js'
import { Expression } from '../core/src/expression.js'
import { Environment } from '../core/src/environment.js'
import { Symbol as LurchSymbol } from '../core/src/symbol.js'
import { Declaration } from '../core/src/declaration.js'
import { Application } from '../core/src/application.js'
import { CNFProp } from './CNFProp.js'

///////////////////////////////////////////////////////////////////////////////
//
// Extensions of LogicConcept
//

/**
 * A more efficient descendants iterator for finding all descendents satisfying
 * an 'include' predicate when it is known that no descendant of a descendant
 * that satisfies the predicte can also satisfy the predicate.  If a second
 * 'exclude' predicate is supplied, that signals that none of its descendants
 * can satisfy the 'include' predicate, so whenever it is true the search can
 * skip that entire branch and move on to its next sibling. The default behavior
 * of this function is to include everything and exclude nothing.  
 *
 * This is useful for finding, say, all statements or declarations or all
 * formulas in an LC. The default is to include everything and exclude nothing.
 *
 * @generator
 * @memberof Extensions
 * @param {function(): boolean} [include = ()=>true] - the include predicate
 * @param {function(): boolean} [exclude = ()=>false] - the exclude predicate
 * @yields {LogicConcept} the next descendant satisfying the predicate include
 */
LogicConcept.prototype.descendantsSatisfyingIterator = 
  function* ( include = x=>true , exclude = x=>false ) {
    if ( include(this) ) { yield this
    } else if (!exclude(this)) { 
      for ( let child of this._children ) { 
        yield* child.descendantsSatisfyingIterator( include , exclude )
      }
    }
  }

/**
 * Find the first occurrence of a descendant of this LC that satisfies the
 * boolean function given by the argument, and return it.  Skip over any branch
 * that is excluded by the second argument. 
 * 
 * @memberof Extensions
 * @param {function(): boolean} [include = ()=>true] include - the include predicate
 * @param {function(): boolean} [exclude = ()=>false] exclude - the exclude predicate
 */
LogicConcept.prototype.find = function ( include = x=>true , exclude = x=>false ) {
  if (exclude(this)) return undefined
  if (include(this)) return this
  for ( let child of this._children ) {
      let ans = child.find(include,exclude) 
      if (ans) return ans 
  }
  return undefined
}

/**
 * Return the Proper Name for a Lurch symbol if it has one, otherwise just
 * return the name of the symbol.
 * 
 * @memberof Extensions
 */
LurchSymbol.prototype.properName = function () {
  return (this.hasAttribute('ProperName')) 
         ? this.getAttribute('ProperName') 
         : this.text() 
}

/////////////////////////////////////////////////////////////////////
// LC type checking and fetching

/**
 * A Statement is any outermost Expression that is not a declaration or a 
 * declared symbol inside a declaration. The body of a declaration can contain
 * statements.
 * 
 * @memberof Extensions
 * @returns {boolean}
 */
LogicConcept.prototype.isAStatement = function () {
  return (this instanceof Expression) && this.isOutermost() &&
         !((this.parent() instanceof Declaration) &&
            this.parent().symbols().includes(this)
          )
}

/**
 * An Equation is an outermost Application whose operation is the Symbol whose
 * .text() is '=' and has at least two arguments.
 * 
 * @memberof Extensions
 * @returns {boolean}
 */
LogicConcept.prototype.isAnEquation = function ( ) {
  return (this instanceof Application) && 
          this.isOutermost() && 
          this.child(0) instanceof LurchSymbol && 
          this.child(0).text()==='=' &&
          this.numChildren()>2
}

/** 
 * Matching syntactic sugar to isAnEquation for Declarations. 
 * 
 * @memberof Extensions
 */
LogicConcept.prototype.isADeclaration = function () { 
  return (this instanceof Declaration)
}

/**
 * We say an LC is a Propositon iff it has a .prop form and is not an
 * environment. This includes all Statements but also Let's, and ForSome's. It
 * does not include the bodies inside ForSome declarations since each of those
 * declarations will have atomic propositional forms and a separate copy of the
 * body. It ignores anything flagged with .ignore for defining shortucts and
 * other content that is supposed to be ignored, and ignores anything passed in
 * the argument ignores.
 * 
 * @memberof Extensions
 * @param {LogicConcept[]} ignores
 * @returns {boolean} 
 */
LogicConcept.prototype.isAProposition = function ( ignores = []) { 
  return ( this.isAStatement()   && 
          !this.ignore           &&
          !this.hasAncestorSatisfying( A => A instanceof Declaration)
         ) || 
         ( this.isADeclaration() && 
          !this.isA('Declare')   &&
          !ignores.includes(this)
         ) 
}

/** 
 * A Let-environment is an environment whose first child is a Let. Check if an
 * LC is a Let-environment.
 *
 * @memberof Extensions
 * @returns {boolean}
 */
LogicConcept.prototype.isALetEnvironment = function () { 
  return (this instanceof Environment && 
          this.child(0) instanceof Declaration &&
          this.child(0).isA('given'))
}

/**
 * We say an LC expression is a Comment if it has the form `(➤ "Comment string
 * here.")`.  These are ignored when computing prop form, and are converted to
 * actual comments when printing the LC to the Lode terminal.
 * 
 * @memberof Extensions
 */
LogicConcept.prototype.isAComment = function () { 
  return (this instanceof Expression && this.numChildren()===2 && 
          this.child(0) instanceof LurchSymbol && 
          this.child(0).text()==='➤')
}

/** 
 * Compute the array of all Statements in this LC 
 * 
 * @memberof Extensions
 */
LogicConcept.prototype.statements = function () {
  return [...this.descendantsSatisfyingIterator( x => x.isAStatement() )]
}

/**
 * Compute the array of all equations in this LC.  If the first argument is
 * true, only return those that are inferences.
 * 
 * @memberof Extensions
 * @param {boolean} conclusionsOnly - if true, only return inferences
 */
LogicConcept.prototype.equations = function ( conclusionsOnly = false ) {
  return [...this.descendantsSatisfyingIterator( 
    x => x.isAnEquation() && (!conclusionsOnly || x.isAConclusionIn()) ,
    x => x.isA('Declare') || x.isA('Rule') || x.isA('Part') || x.isA('Inst') )]
}

/**
 * Compute the array of all declarations in this LC If the optional argument
 * onlywithbodies is true, only return declarations with bodies.
 * 
 * @memberof Extensions
 * @param {boolean} onlywithbodies - if true, only return declarations with bodies
 * @returns {LogicConcept[]}
 */
LogicConcept.prototype.declarations = function ( onlywithbodies ) {
  return [...this.descendantsSatisfyingIterator( x => 
             x instanceof Declaration && 
             !x.isA('Declare')  &&  (!onlywithbodies || x.body())
         )]
}

/** 
 * Compute the array of all Declare's in this LC. 
 * 
 * @memberof Extensions
 */
LogicConcept.prototype.Declares = function () {
  return [...this.descendantsSatisfyingIterator( x => x.isA('Declare') )]
}

/** 
 * Compute the array of all Rule's in this LC. 
 * 
 * @memberof Extensions
 */
LogicConcept.prototype.Rules = function () {
  return [...this.descendantsSatisfyingIterator( x => x.isA('Rule') )]
}

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
 * A Let is defined to be a given declaration that is not marked as a 'Declare'
 * whether or not it has a body
 * 
 * @memberof Extensions
 * @returns {boolean}
 */
LogicConcept.prototype.isALet = function ( ) {
  return (this instanceof Declaration && this.isA('given') && !this.isA('Declare'))
}

/**
 * Get the array of all of the Let ancestors of this LC Note: since everything
 * is its own ancestor by default, the Let that is the first child of a Let
 * environment is considered to be a letAncestor of the Let environment.
 * 
 * @memberof Extensions
 * @returns {LogicConcept[]}
 */
LogicConcept.prototype.letAncestors = function ( ) {
  return this.ancestorsSatisfying(x => 
    x instanceof Environment && 
    x.numChildren()>0 && 
    x.firstChild().isALet()).map(a=>a.firstChild())
}

/** Compute the array of all of the Let's in the scope of this Let. 
 * 
 * @memberof Extensions
 */
Declaration.prototype.letsInScope = function ( ) {
  return this.scope().filter( x => x.isALet() )
}

/**
 * Compute the array of all Let's in this LC. If the argument is true, only
 * return those with bodies.
 * 
 * @memberof Extensions
 * @param {boolean} onlywithbodies - if true, only return declarations with bodies
 */
LogicConcept.prototype.lets = function ( onlywithbodies ) {
  return [...this.descendantsSatisfyingIterator( x => 
     x instanceof Declaration && x.isA('given') && 
     !x.isA('Declare') &&  (!onlywithbodies || x.body())
  )]
}

/**
 * Compute the array of all Let's in this environment whose parent is an
 * inference in this environment
 * 
 * @memberof Extensions
 * 
 */
Environment.prototype.letInferences = function ( inThis ) {
  return this.lets().filter( L => L.parent().hasOnlyClaimAncestors( inThis ) )
}

/** 
 * Compute the array of arrays containing the user's various let scopes, labled by their  
 * letAncestors.
 * 
 * @memberof Extensions
 */
Environment.prototype.scopes = function ( ) {
  return this.letInferences().map( y => y.letAncestors() )
}

// TODO: many routines take both doc and target as arguments.  We could just
//       take the target and use the .root() method to determine the doc.

/**
 * Compute the array of all ForSomes's in this LC.  If the argument is true,
 * only return those with bodies.
 * 
 * @memberof Extensions
 */
LogicConcept.prototype.forSomes = function ( onlywithbodies ) {
  return [...this.descendantsSatisfyingIterator( x => 
           x instanceof Declaration && !x.isA('given') && 
           !x.isA('Declare')  &&  (!onlywithbodies || x.body())
         )]
}

/**
 * Compute the array of all formulas that are not marked as `.finished` in this LC
 * the optional argument, if true, tells it to return all formulas,
 * whether they are finished or not.
 * 
 * @memberof Extensions
 * @param {boolean} [includefinished=false] - if true, return all formulas
 */
LogicConcept.prototype.formulas = function ( includefinished=false ) {
  return [...this.descendantsSatisfyingIterator( x => 
          ((x.isA('Rule') || x.isA('Part')) && (includefinished || !x.finished )))]
}

/** 
 * Compute the array of all propositions in this LC. 
 * 
 * @memberof Extensions
 */
LogicConcept.prototype.propositions = function () {
  return [...this.descendantsSatisfyingIterator( x => x.isAProposition() )]
}

/**
 * We say an LC is an _inference_ of an environment `L` if it is either
 * 
 *    (a) a conclusion of that environment or
 * 
 *    (b) an environment whose ancestors are all claims, except possibly for `L`
 * 
 * i.e., it extends the notion of a conclusion to include environments. `L` is
 * not considered to be a conclusion or inference of itself.
 * 
 * Compute the array of all inferences in this environment.
 *   
 */
Environment.prototype.inferences = function () {
  // this is effectively the same code as for .conclusions
  let ans = [ ]
  this.children().forEach( child => {
    if ( child.isA( 'given' ) || child.isAComment() ) return
    // we assume Declare declarations are given's for now
    if ( child instanceof Expression || child instanceof Declaration )
        ans.push( child ) // guaranteed to be outermost expr/decl
    else if ( child instanceof Environment ) {
        ans.push( child ) // the only difference between this and conclusions
        ans = ans.concat( child.inferences() )
    }    
  })
  return ans
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

/** 
 * Compute the array of all LurchSymbols in this LC 
 * 
 * @memberof Extensions
 */
LogicConcept.prototype.symbols = function () {
  return this.descendantsSatisfying( x => x instanceof LurchSymbol )
}

/**
 * Compute the Prop Form string for an expression.  This is the `.putdown` form
 * except that we must use the `ProperName` for symbols instead of their text.
 * For bound symbols, this is their canonical name so alpha equivalent
 * expressions have the same propositional form.  For symbols declared with a
 * body this is the renaming that accounts for the body. Note that the Prop form
 * does not include the leading `:` for givens. 
 *
 * We cache the results in a `.propform` js attribute and return them if
 * present.
 *
 * In order to check for preemies we need a different propositional form in some
 * cases. The optional argument `ignore` is an array of Let's such that if a
 * symbol in the expression is defined by one of the Let's on the list, we use
 * its text name instead of its `ProperName` (i.e., no tick marks).  These are
 * not cached in the `.propform` attribute (when ignore is nonempty).
 *
 * @memberof Extensions
 * @param {LogicConcept[]} [ignore=[]] - an array of Let's to ignore when computing this
 * propositional form.
 */
Expression.prototype.prop = function ( ignore = [] ) {
  // determine exactly when to use the proper name
  return this.toPutdown((L,S,A) => {
    let ans =
      // if this is not a Symbol, or
      ( !(L instanceof LurchSymbol) ||
        // it is a Symbol, and
        ( L instanceof LurchSymbol &&   
            // either declared by one of the ignored lets, or
          ( (L.declaredBy && ignore.includes(L.declaredBy)) ||
              // undeclared (e.g. in an instantiation or binding) and 
            ( !(L.declaredBy) && 
              // has the same propername as something declared by one of the
              // ignored lets
              ignore.some( x => x.symbols().some( x => 
                x.properName()===L.properName()) 
              ) 
            )
          )
        )
      ) 
      // use it's original name
      ? S
      // otherwise use it's properName
      : L.properName()
    return ans.replace( /^[:]/, '' )
  })
}

/**
 * Compute the Prop Form string for a `Let` or `ForSome` Declaration. We will
 * format both as `[s₁ ... sₙ]` where $s_i$ is the properName of the
 * $i^\text{th}$ symbol it declares, whether or not it has a body, since
 * interpretation will put a copy of the body after the declaration, which then
 * will get its own propositional form. Declare's don't have a prop form.
 *
 * Note that the Prop form does not include the leading : for givens.
 *
 * Compute the Preemie Prop Form string for a Let or ForSome Declaration. This
 * is the same as the ordinary prop form, but is ignored if it is contained on
 * the ignore argument list (of Lets to ignore).
 *
 * @memberof Extensions
 * @param {LogicConcept[]} [ignore=[]] - an array of declarations to ignore when computing this
 * propositional form.
 */
Declaration.prototype.prop = function ( ignore = [] ) {
  return this.isA('Declare') || ignore.includes(this)
         ? '' 
         : '['+this.symbols().map(s=>s.properName()).join(' ')+']'
}

/**
 * Compute all of the propositional forms of this expression (both standard and
 * preemie) and return them as a Set.  This is not defined for environments.
 * 
 * @memberof Extensions
 */
Expression.prototype.allProps = function ( ) {
  // if its the user's proposition, use it's own scopes
  if (this.parent().hasOnlyClaimAncestors()) {
    // get the lets it is in the scope of
    const mylets = this.letAncestors()
    // it is possible that any sub-scope might be being tested, so we need
    // to add all of the possible forms
    let ans = new Set(mylets.map( (x,k) => this.prop(mylets.slice(k))))
    ans.add(this.prop())
    return ans
  // but if it is in an instantiation and has any undeclared tick marks, check
  // it against every possible scope 
  //
  // TODO: is it more efficient to eliminate any scopes not involving any of the
  // tick-marked symbols in this expression, or would that take more time than
  // simply checking against all of the scopes?
  } else if (this.hasDescendantSatisfying( x => 
    x instanceof LurchSymbol && 
    x.properName().endsWith("'") &&
    !x.constant
  ) ) {
    // get the cached value of all of the let-scopes
    const scopes = this.root().letScopes
    // add the propform for this for each of the let-scopes
    let ans = new Set([ this.prop() ])
    // check every scope to see if it gives this a new prop form
    scopes.forEach( s => ans = ans.add(this.prop(s)) )
    return ans
  }
  return new Set([this.prop()])
}

/**
 * Declarations can only have one prop form, but we need it to be consistent
 * with the previous routine.
 * 
 * @memberof Extensions
 */
Declaration.prototype.allProps = function ( ) {
  return new Set([this.prop()])
}

/** 
 * Compute the catalog for this LC environment. 
 * 
 * @memberof Extensions
 */
Environment.prototype.catalog = function ( ) {
  // store them in here
  let catalog = new Set()
  // some propositions might contain tickmarked symbols that are not in the
  // scope of any declaration of that symbol. To minimize the number of prop
  // forms for such a proposition, we need to know all of the let-scopes in the
  // document.  Ignore everything containing a metavariable.
  this.propositions()
      .filter( P => !P.hasDescendantSatisfying( x => x.isA('LDE MV') ) )
      .map( s => s.allProps() )
      .forEach( x => catalog = catalog.union( x ) )
  return [ ...catalog ] 
}

/** 
 * Look up this expression's numerical prop form in the catalog. 
 * 
 * @memberof Extensions
 * @param {string[]} catalog - the catalog
 * @param {LogicConcept[]} [ignores=[]] - an array of LCs to ignore
 */
Expression.prototype.lookup = function ( catalog , ignores = []) {
  return catalog.indexOf(this.prop(ignores)) + 1
}

/** 
 * Look up this declarations's numerical prop form in the catalog 
 * 
 * @memberof Extensions
 * @param {string[]} catalog - the catalog
 * @param {LogicConcept[]} [ignores=[]] - an array of LCs to ignore
 */
Declaration.prototype.lookup = function ( catalog, ignores = []) {
  return catalog.indexOf(this.prop(ignores)) + 1
}

/** 
 * The cnf of this Environment in satSolve format.
 * 
 * @memberof Extensions
 * @param {LogicConcept} [target=this] - the target
 * @param {boolean} [checkPreemies=false] - if true, check for preemies
 */
Environment.prototype.cnf = function ( target=this , checkPreemies = false ) {
  // get the catalog.. this assumes this environment is a document and checks if
  // it has been cached
  let cat = this.cat || this.catalog()
  // number the switch vars starting at one more than the catalog length
  let n = cat.length+2 
  // make the CNFProp from this LC, either with or without the preemie check
  let ans = CNFProp.fromLC( this , cat , target , checkPreemies ).simplify()
  // convert the resulting CNFProp to a cnf that can be passed to CNF.isSatisfiable
  return CNFProp.toCNF(ans,{num:n})
}

////////////////////////////////////////////////////////////////////////////////


/**
 * Replacement for `Validation.result()` that supports more than one result (up to
 * one for each plugin-tool of global validation). For example, a BIH can be
 * validated separately by the BIH tool and the global propositional tool. 
 *
 * Get the results for this toolname.
 * 
 * @memberof Extensions
 * @param {string} [toolname] - the name of the tool
 * @return {object} - the results
 */
LogicConcept.prototype.results = function (toolname) {
  const results = this.getAttribute( 'validation results' )
  return (results) ? results[toolname] : undefined
}

/**
 * Replacement for `Validation.setResult()` that supports more than one result (up to
 * one for each plugin-tool of global validation). For example, a BIH can be
 * validated separately by the BIH tool and the global propositional tool. 
 *
 * Set the result for this toolname.
 * 
 * @memberof Extensions
 * @param {string} [toolname] - the name of the tool
 * @param {string} [result] - the result
 * @param {string} [reason] - the reason
 */
LogicConcept.prototype.setResult = function (toolname, result, reason) {
  // if there is no validation results object for any tool, make a blank one
  const allResults = (this.getAttribute('validation results')) ? 
                      this.getAttribute('validation results') :
                      { }
  // get the current result object for this tool, if any, or make a new one
  const resultObj = (this.results(toolname)) ? this.results(toolname) : { }
  // if the first arg is a string, set it
  if (typeof result === 'string') { 
    resultObj.result = result
    // same for reason
    if (typeof reason === 'string') { resultObj.reason = reason }
  } else {
    // the second arg must be an object, though we don't enforce that
    resultObj = result
  }
  // update the attribute
  allResults[toolname] = resultObj
  this.setAttribute('validation results',allResults) 
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
    ...Object.keys(this).filter(x=> x[0]!=='_')
      .map( key => [key,this[key]]) ,
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

// Check if this LC is a Lurch symbol whose text matches the regular expression
// formed by the string argument s
LogicConcept.prototype.matches = function(s) {
  return this instanceof LurchSymbol && new RegExp(`^${s}$`).test(this.text())
}