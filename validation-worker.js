
/**
 * This module runs in a background thread, not the browser's main (UI) thread.
 * It grades documents submitted to it in serialized form, and transmits
 * feedback messages about their contents back to the main thread.  It is not
 * yet at the level of sophistication we eventually plan for, but it can already
 * do a lot.  It imports all the validation tools from
 * {@link https://lurchmath.github.io/lde our deductive engine repository} and
 * uses them to validate documents.
 * 
 * None of the functions in this module are called by any external client, and
 * hence none are documented here.  Rather, this script is loaded into Web
 * Worker instances, and messages are passed to it as documented above, and
 * messages are received back from it as documented in
 * {@link module:Validation the validation module}.
 * 
 * @module ValidationWorker
 */

import { Message } from './validation-messages.js'
import LDE from 'https://cdn.jsdelivr.net/gh/lurchmath/lde@85e7368b912116420a2dc7475c616a721ec38ba1/src/experimental/global-validation.js'
const LogicConcept = LDE.LogicConcept

// Listen for messages from the main thread, which should send putdown notation
// for a document to validate.  When it does, we run our one (temporary
// placeholder) validation routine, which will send "feedback" and "done"
// messages, as appropriate.  Any non-putdown messages we receive generate error
// feedback instead.
addEventListener( 'message', event => {
    const message = new Message( event )
    if ( !message.is( 'document' ) )
        return Message.error( 'Not a document message' )
    const encoding = message.get( 'encoding' )
    const code = message.get( 'code' )
    try {
        if ( encoding == 'putdown' ) {
            const LCs = LogicConcept.fromPutdown( code )
            if ( LCs.length != 1 )
                throw new Error( 'Incorrect number of LCs: ' + LCs.length )
            validateDocument( LCs[0] )
        } else if ( encoding == 'json' ) {
            validateDocument( LogicConcept.fromJSON( code ) )
        } else {
            throw new Error( `Not a valid document encoding: ${encoding}` )
        }
    } catch ( error ) {
        Message.error( `Error decoding document: ${error.message || error}` )
        Message.done()
    }
} )

// Find the highest-priority validation result, or undefined if the given LC
// has no validation result attached to it.  This unites all the different ways
// we've invented to attach feedback to something, which are kind of a mess that
// this routine cleans up.  We should clean it up ourselves later, but for now,
// this routine is our solution.
const getValidationResults = LC => {
    const results = [ ]
    // Scope errors are highest priority
    const scopeErrors = LDE.Scoping.scopeErrors( LC )
    if ( scopeErrors && scopeErrors.redeclared )
        results.push( {
            type : 'scoping',
            result : 'invalid',
            reason : `Trying to re-declare ${scopeErrors.redeclared.join(", ")}`
        } )
    if ( scopeErrors && scopeErrors.undeclared )
        results.push( {
            type : 'scoping',
            result : 'invalid',
            reason : `Using ${scopeErrors.undeclared.join(", ")} undeclared`
        } )
    // Find any type of validation feedback that was produced before prop
    // validation, such as instantiation hint structure
    const otherErrors = LC.getAttribute( 'validation results' )
    const otherErrorTypes = Object.keys( otherErrors || { } )
    for ( let type of otherErrorTypes )
        if ( otherErrors[type].result == 'invalid' )
            results.push( { type : 'misc', ...otherErrors[type] } )
    // Final result is the prop validation result, if any
    const propResult = LDE.Validation.result( LC )
    if ( propResult )
        results.push( { type : 'propositional', ...propResult } )
    return results
}

// Validate using the imported Lurch Deductive Engine (LDE) module
const validateDocument = LC => {
    console.log( LC.toPutdown() )
    try {
        LDE.validate( LC )
    } catch ( error ) {
        // console.log( error.stack )
        Message.error( `Error running LDE validation: ${error.message}` )
        return
    }
    console.log( LC.toPutdown() )
    for ( let descendant of LC.descendantsIterator() ) {
        const results = getValidationResults( descendant )
        if ( results.length == 0 ) continue
        try {
            let walk
            for ( walk = descendant ; walk ; walk = walk.parent() )
                if ( walk.ID() ) break
            Message.feedback( {
                id : descendant.ID(),
                ancestorID : walk ? walk.ID() : undefined,
                // address : descendant.address( LC ),
                // putdown : descendant.toPutdown(),
                results : results
            } )
        } catch ( error ) {
            Message.error( `Error generating feedback: ${error.message}` )
        }
    }
    Message.done()
}
