
import { Symbol as LurchSymbol } from '../src/symbol.js'
import { MathConcept } from '../src/math-concept.js'
import { LogicConcept } from '../src/logic-concept.js'
import { Expression } from '../src/expression.js'

describe( 'Symbol', () => {

    it( 'Should declare the relevant global identifiers', () => {
        expect( LurchSymbol ).to.be.ok
    } )

    it( 'Should let us query the text given at construction time', () => {
        // Create the same symbols as above and query the text in each.
        // It should be exactly the same as was provided at construction time.
        let S = new LurchSymbol( 'hello' )
        expect( S.text() ).to.equal( 'hello' )
        S = new LurchSymbol( '1' )
        expect( S.text() ).to.equal( '1' )
        S = new LurchSymbol( 'Four score and seven years ago' )
        expect( S.text() ).to.equal( 'Four score and seven years ago' )
        S = new LurchSymbol( 'αβγδε' )
        expect( S.text() ).to.equal( 'αβγδε' )
        S = new LurchSymbol( 'x₁' )
        expect( S.text() ).to.equal( 'x₁' )
        S = new LurchSymbol( { } )
        expect( S.text() ).to.equal( '[object Object]' )
        S = new LurchSymbol( [ ] )
        expect( S.text() ).to.equal( 'undefined' )
        S = new LurchSymbol
        expect( S.text() ).to.equal( 'undefined' )
    } )

    it( 'Should let us change the text and yield the new value upon query', () => {
        // Create one symbols, then change its text to all the examples above,
        // re-checking it with text() in each case.
        const S = new LurchSymbol( 'hello' )
        expect( S.text() ).to.equal( 'hello' )
        S.setText( '1' )
        expect( S.text() ).to.equal( '1' )
        S.setText( 'Four score and seven years ago' )
        expect( S.text() ).to.equal( 'Four score and seven years ago' )
        S.setText( 'αβγδε' )
        expect( S.text() ).to.equal( 'αβγδε' )
        S.setText( 'x₁' )
        expect( S.text() ).to.equal( 'x₁' )
        S.setText( { } )
        expect( S.text() ).to.equal( '[object Object]' )
        S.setText( [ ] )
        expect( S.text() ).to.equal( 'undefined' )
        S.setText()
        expect( S.text() ).to.equal( 'undefined' )
    } )

    it( 'Should have a toString() representation equal to its text', () => {
        // Exactly the same test as the previous, but with toString() instead
        let S = new LurchSymbol( 'hello' )
        expect( S.toString() ).to.equal( 'hello' )
        S = new LurchSymbol( '1' )
        expect( S.toString() ).to.equal( '1' )
        S = new LurchSymbol( 'Four score and seven years ago' )
        expect( S.toString() ).to.equal( 'Four score and seven years ago' )
        S = new LurchSymbol( 'αβγδε' )
        expect( S.toString() ).to.equal( 'αβγδε' )
        S = new LurchSymbol( 'x₁' )
        expect( S.toString() ).to.equal( 'x₁' )
        S = new LurchSymbol( { } )
        expect( S.toString() ).to.equal( '[object Object]' )
        S = new LurchSymbol( [ ] )
        expect( S.toString() ).to.equal( 'undefined' )
        S = new LurchSymbol
        expect( S.toString() ).to.equal( 'undefined' )
    } )

    it( 'Should respect the "evaluate as" field to compute value()', () => {
        // Create five symbols and ensure that none of them has a defined
        // value, because we set no "evaluate as" attribute on any of them.
        let S1 = new LurchSymbol( 'hello' )
        let S2 = new LurchSymbol( '548' )
        let S3 = new LurchSymbol( '-578.12379' )
        let S4 = new LurchSymbol( '9.3257268e31' )
        let S5 = new LurchSymbol( 'Infinity' )
        expect( S1.value() ).to.be.undefined
        expect( S2.value() ).to.be.undefined
        expect( S3.value() ).to.be.undefined
        expect( S4.value() ).to.be.undefined
        expect( S5.value() ).to.be.undefined
        // Now claim that all should be evaluated as integers, and verify
        // that this succeeds in reading three of them as an integers, the
        // rest returning NaN.
        S1.setAttribute( 'evaluate as', 'integer' )
        S2.setAttribute( 'evaluate as', 'integer' )
        S3.setAttribute( 'evaluate as', 'integer' )
        S4.setAttribute( 'evaluate as', 'integer' )
        S5.setAttribute( 'evaluate as', 'integer' )
        expect( isNaN( S1.value() ) ).to.equal( true )
        expect( isNaN( S2.value() ) ).to.equal( false )
        expect( S2.value() ).to.equal( 548 )
        expect( isNaN( S3.value() ) ).to.equal( false )
        expect( S3.value() ).to.equal( -578 )
        expect( isNaN( S4.value() ) ).to.equal( false )
        expect( S4.value() ).to.equal( 9 )
        expect( isNaN( S5.value() ) ).to.equal( true )
        // Now claim that all should be evaluated as real, and verify that
        // this succeeds in reading all but one of them as a float, the other
        // returning NaN.
        S1.setAttribute( 'evaluate as', 'real' )
        S2.setAttribute( 'evaluate as', 'real' )
        S3.setAttribute( 'evaluate as', 'real' )
        S4.setAttribute( 'evaluate as', 'real' )
        S5.setAttribute( 'evaluate as', 'real' )
        expect( isNaN( S1.value() ) ).to.equal( true )
        expect( isNaN( S2.value() ) ).to.equal( false )
        expect( S2.value() ).to.equal( 548 )
        expect( isNaN( S3.value() ) ).to.equal( false )
        expect( S3.value() ).to.equal( -578.12379 )
        expect( isNaN( S4.value() ) ).to.equal( false )
        expect( S4.value() ).to.equal( 9.3257268e31 )
        expect( isNaN( S5.value() ) ).to.equal( false )
        expect( S5.value() ).to.equal( Infinity )
        // Now claim that all should be evaluated as a string, and verify that
        // this succeeds in all cases, yielding the same text with which the
        // Symbols were constructed
        S1.setAttribute( 'evaluate as', 'string' )
        S2.setAttribute( 'evaluate as', 'string' )
        S3.setAttribute( 'evaluate as', 'string' )
        S4.setAttribute( 'evaluate as', 'string' )
        S5.setAttribute( 'evaluate as', 'string' )
        expect( S1.value() ).to.equal( 'hello' )
        expect( S2.value() ).to.equal( '548' )
        expect( S3.value() ).to.equal( '-578.12379' )
        expect( S4.value() ).to.equal( '9.3257268e31' )
        expect( S5.value() ).to.equal( 'Infinity' )
    } )

    it( 'Should let us copy Symbols, retaining their content', () => {
        // This just ensures that copying a Symbol copies its text faithfully.
        let S1 = new LurchSymbol( 'some text here' )
        let S2 = new LurchSymbol( '***' )
        let S3 = S1.copy()
        let S4 = S2.copy()
        expect( S3 ).to.be.instanceof( LurchSymbol )
        expect( S4 ).to.be.instanceof( LurchSymbol )
        expect( S3.numChildren() ).to.equal( 0 )
        expect( S4.numChildren() ).to.equal( 0 )
        expect( S3.text() ).to.equal( S1.text() )
        expect( S4.text() ).to.equal( S2.text() )
        expect( S3.text() ).to.equal( 'some text here' )
        expect( S4.text() ).to.equal( '***' )
    } )

    it( 'Should not let us add children to a Symbol instance', () => {
        // Create an instance for testing and ensure it has no children
        let S = new LurchSymbol( 'S' )
        expect( S.numChildren() ).to.equal( 0 )
        // Try to add a child of various types, and ensure that at no point
        // does it actually work
        let tryThis = new MathConcept
        S.insertChild( tryThis )
        expect( S.numChildren() ).to.equal( 0 )
        expect( tryThis.parent() ).to.equal( null )
        tryThis = new LogicConcept
        S.insertChild( tryThis )
        expect( S.numChildren() ).to.equal( 0 )
        expect( tryThis.parent() ).to.equal( null )
        tryThis = new Expression
        S.insertChild( tryThis )
        expect( S.numChildren() ).to.equal( 0 )
        expect( tryThis.parent() ).to.equal( null )
        tryThis = new LurchSymbol( 'tt' )
        S.insertChild( tryThis )
        expect( S.numChildren() ).to.equal( 0 )
        expect( tryThis.parent() ).to.equal( null )
        // Repeat those same tests but with pushChild() instead.
        tryThis = new MathConcept
        S.pushChild( tryThis )
        expect( S.numChildren() ).to.equal( 0 )
        expect( tryThis.parent() ).to.equal( null )
        tryThis = new LogicConcept
        S.pushChild( tryThis )
        expect( S.numChildren() ).to.equal( 0 )
        expect( tryThis.parent() ).to.equal( null )
        tryThis = new Expression
        S.pushChild( tryThis )
        expect( S.numChildren() ).to.equal( 0 )
        expect( tryThis.parent() ).to.equal( null )
        tryThis = new LurchSymbol( 'tt' )
        S.pushChild( tryThis )
        expect( S.numChildren() ).to.equal( 0 )
        expect( tryThis.parent() ).to.equal( null )
    } )

} )
