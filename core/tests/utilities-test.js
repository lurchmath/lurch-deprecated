
import { predictableStringify } from '../src/utilities.js'

describe( 'Utilities', () => {

    it( 'Ensure all expected global identifiers are declared', () => {
        expect( predictableStringify ).to.be.ok
        expect( JSON.equals ).to.be.ok
    } )

} )

describe( 'JSON tools', () => {

    it( 'predictableStringify yields JSON with alphabetical keys', () => {
        // test some atomics
        expect( predictableStringify( 5 ) ).to.equal( "5" )
        expect( predictableStringify( 'five' ) ).to.equal( '"five"' )
        // test some empty containers
        expect( predictableStringify( [ ] ) ).to.equal( "[]" )
        expect( predictableStringify( { } ) ).to.equal( "{}" )
        // test an array
        expect( predictableStringify( [ 1, 'two', 3.3 ] ) ).to.equal( '[1,"two",3.3]' )
        // test predictable alphabetical-ness of keys
        expect( predictableStringify( { a : 'x', b : 'y' } ) ).to.equal(
            '{"a":"x","b":"y"}' )
        expect( predictableStringify( { b : 'y', a : 'x' } ) ).to.equal(
            '{"a":"x","b":"y"}' )
        // do a compound example with some nesting
        expect( predictableStringify( {
            one : 1,
            two : -222.222,
            three : [ 3, 3, 3 ],
            four : { f : 'o', u : 'r', t : 'y' }
        } ) ).to.equal(
            '{"four":{"f":"o","t":"y","u":"r"},"one":1,"three":[3,3,3],"two":-222.222}'
        )
    } )

    it( 'JSON.equals correctly assesses structural equality', () => {
        // build a whole bunch of data amenable to JSON encoding
        const values = [
            1, -10, 33.33, 'my string', "your string",
            [ ], { }, [ 'one' ], [ 50, -99, 0, 3000 ], { k : 'v' },
            { name : 'Sam', atBats : 50, hits : 15, RBIs : 8 },
            [ { x : 1 }, { y : 10 } ]
        ]
        // make deep structural copies of all of them, the slow but sure way
        const copies = values.map( x => JSON.parse( JSON.stringify( x ) ) )
        // ensure that everything in the values array matches only itself,
        // under the JSON.equals comparison
        for ( let i = 0 ; i < values.length ; i++ )
            for ( let j = 0 ; j < values.length ; j++ )
                expect( JSON.equals( values[i], values[j] ) ).to.equal( i == j )
        // ensure the same about everything in the copies array
        for ( let i = 0 ; i < values.length ; i++ )
            for ( let j = 0 ; j < values.length ; j++ )
                expect( JSON.equals( copies[i], copies[j] ) ).to.equal( i == j )
        // ensure the same if we use an entry from the values array compared to
        // an entry from the copies array
        for ( let i = 0 ; i < values.length ; i++ )
            for ( let j = 0 ; j < values.length ; j++ )
                expect( JSON.equals( values[i], copies[j] ) ).to.equal( i == j )
    } )

    it( 'JSON.copy creates entirely new objects that satisfy JSON.equals', () => {
        // build all the same JSON testing data as in the previous test, except
        // this time, classify atomics vs. non-atomics
        const atomicValues = [
            1, -10, 33.33, 'my string', "your string"
        ]
        const nonAtomicValues = [
            [ ], { }, [ 'one' ], [ 50, -99, 0, 3000 ], { k : 'v' },
            { name : 'Sam', atBats : 50, hits : 15, RBIs : 8 },
            [ { x : 1 }, { y : 10 } ]
        ]
        const allValues = atomicValues.concat( nonAtomicValues )
        // ensure that every atomic value copies to something that is both
        // JSON.equals() with the original and actually === the original also,
        // but that neither is true for two different atomic values
        for ( let i = 0 ; i < atomicValues.length ; i++ ) {
            const copy = JSON.copy( atomicValues[i] )
            for ( let j = 0 ; j < atomicValues.length ; j++ ) {
                if ( i == j ) {
                    expect( copy ).to.equal( atomicValues[j] )
                    expect( JSON.equals( copy, atomicValues[j] ) )
                } else {
                    expect( copy ).to.not.equal( atomicValues[j] )
                    expect( !JSON.equals( copy, atomicValues[j] ) )
                }
            }
        }
        // repeat the above test for non-atomic values, except ensure that
        // they are only JSON.equals, NOT ===.
        for ( let i = 0 ; i < nonAtomicValues.length ; i++ ) {
            const copy = JSON.copy( nonAtomicValues[i] )
            for ( let j = 0 ; j < nonAtomicValues.length ; j++ ) {
                expect( copy ).to.not.equal( nonAtomicValues[j] )
                expect( JSON.equals( copy, nonAtomicValues[j] ) ).to.equal( i == j )
            }
        }
        // ensure that every atomic value and its copy are totally different
        // from any nonAtomic value
        for ( let i = 0 ; i < atomicValues.length ; i++ ) {
            const copy = JSON.copy( atomicValues[i] )
            for ( let j = 0 ; j < nonAtomicValues.length ; j++ ) {
                expect( copy ).to.not.equal( nonAtomicValues[j] )
                expect( !JSON.equals( copy, nonAtomicValues[j] ) )
            }
        }
        // ensure that every nonAtomic value and its copy are totally different
        // from any atomic value
        for ( let i = 0 ; i < nonAtomicValues.length ; i++ ) {
            const copy = JSON.copy( nonAtomicValues[i] )
            for ( let j = 0 ; j < atomicValues.length ; j++ ) {
                expect( copy ).to.not.equal( atomicValues[j] )
                expect( !JSON.equals( copy, atomicValues[j] ) )
            }
        }
    } )

} )

describe( 'Prototype extensions', () => {

    it( 'The Map.prototype.deepCopy function behaves correctly', () => {
        // create a Map with all JSON-encodable contents (because the function
        // we are testing is guaranteed to work only for such Maps)
        const M = new Map( [
            [ 'favorite number', 5 ],
            [ 'favorite color', 'blue' ],
            [ 'favorite bands', [
                'Destroy the Raging Monkeys',
                'Unbelievable Hangover',
                'Thrash Machine from the Grave'
            ] ],
            [ 'favorite data', { one : 1, two : 2, three : 3 } ]
        ] )
        // make a deep copy
        const Mcopy = M.deepCopy()
        // verify that the two maps have the same sets of keys
        expect( M.keys() ).to.eql( Mcopy.keys() )
        // verify that all atomic values are identical
        expect( M.get( 'favorite number' ) ).to.equal(
            Mcopy.get( 'favorite number' ) )
        expect( M.get( 'favorite color' ) ).to.equal(
            Mcopy.get( 'favorite color' ) )
        // verify that all non-atomic values match structurally
        expect( M.get( 'favorite bands' ) ).to.eql(
            Mcopy.get( 'favorite bands' ) )
        expect( M.get( 'favorite data' ) ).to.eql(
            Mcopy.get( 'favorite data' ) )
        // verify that all non-atomic values are not identical
        expect( M.get( 'favorite bands' ) ).not.to.equal(
            Mcopy.get( 'favorite bands' ) )
        expect( M.get( 'favorite data' ) ).not.to.equal(
            Mcopy.get( 'favorite data' ) )
    } )

    it( 'The Array.prototype.without() function works as expected', () => {
        // test on an array of values
        let array = [ 1, 2, 3 ]
        expect( array.without( -1 ) ).to.eql( [ 1, 2, 3 ] )
        expect( array.without( 0 ) ).to.eql( [ 2, 3 ] )
        expect( array.without( 1 ) ).to.eql( [ 1, 3 ] )
        expect( array.without( 2 ) ).to.eql( [ 1, 2 ] )
        expect( array.without( 3 ) ).to.eql( [ 1, 2, 3 ] )
        // test on an array of references
        array = [ { }, { } ]
        let test = array.without()
        expect( test ).not.to.equal( array )
        expect( test ).to.eql( [ { }, { } ] )
        expect( test[0] ).to.equal( array[0] )
        expect( test[1] ).to.equal( array[1] )
        test = array.without( 0 )
        expect( test ).not.to.equal( array )
        expect( test ).to.eql( [ { } ] )
        expect( test[0] ).to.equal( array[1] )
        test = array.without( 1 )
        expect( test ).not.to.equal( array )
        expect( test ).to.eql( [ { } ] )
        expect( test[0] ).to.equal( array[0] )
        test = array.without( 2 )
        expect( test ).not.to.equal( array )
        expect( test ).to.eql( [ { }, { } ] )
        expect( test[0] ).to.equal( array[0] )
        expect( test[1] ).to.equal( array[1] )
    } )

    it( 'The Array.prototype.last() function works as expected', () => {
        // make some objects for use in testing
        const obj1 = { }
        const obj2 = /foo/
        const obj3 = [ [ [ ] ] ]
        // run some tests
        expect( [ 1, 2, 3 ].last() ).to.equal( 3 )
        expect( [ 'help', 'me' ].last() ).to.equal( 'me' )
        expect( [ obj1, obj2, obj3 ].last() ).to.equal( obj3 )
        expect( [ obj2 ].last() ).to.equal( obj2 )
        expect( [ obj1, obj1 ].last() ).to.equal( obj1 )
        expect( [ ].last() ).to.equal( undefined )
    } )

    it( 'The Array.range() function works as expected', () => {
        expect( Array.range() ).to.have.ordered.members( [ ] )
        expect( Array.range(6) ).to.have.ordered.members( [0,1,2,3,4,5] )
        expect( Array.range(1) ).to.have.ordered.members( [0] )
        expect( Array.range(0) ).to.have.ordered.members( [ ] )
        expect( Array.range(2,6) ).to.have.ordered.members( [2,3,4,5,6] )
        expect( Array.range(0,6) ).to.have.ordered.members( [0,1,2,3,4,5,6] )
        expect( Array.range(-2,2) ).to.have.ordered.members( [-2,-1,0,1,2] )
        expect( Array.range(-5,5,3) ).to.have.ordered.members( [-5,-2,1,4] )
        expect( Array.range(-5,4,3) ).to.have.ordered.members( [-5,-2,1,4] )
        expect( Array.range(-5,3,3) ).to.have.ordered.members( [-5,-2,1] )
        expect( Array.range(5,1,-1) ).to.have.ordered.members( [5,4,3,2,1] )
        expect( Array.range(5,-5,-2) ).to.have.ordered.members( [5,3,1,-1,-3,-5] )
        expect( Array.range(2,2) ).to.have.ordered.members( [ 2 ] )
        expect( Array.range(2,1) ).to.have.ordered.members( [  ] )
        expect( Array.range(1, 2, 0) ).to.have.ordered.members( [ ] )
    } )

    it( 'The Array.seq() function works as expected', () => {
        expect( Array.seq(n=>2*n,3,5) ).to.have.ordered.members( [6,8,10] )
        expect( Array.seq(n=>n,0,4) ).to.have.ordered.members( [0,1,2,3,4] )
        expect( Array.seq((n,m)=>n+1,0,4) ).to.have.ordered.members( [1,2,3,4,5] )
    } )

    it( 'The Set.prototype.equals() function works as expected', () => {
        // equal sets
        expect( new Set( [ 1, 2, 3 ] ).equals( new Set( [ 1, 2, 3 ] ) ) )
            .to.equal( true )
        expect( new Set( [ 1, 2, 3 ] ).equals( new Set( [ 3, 2, 1 ] ) ) )
            .to.equal( true )
        expect( new Set( [ 1, 2, 3 ] ).equals(
            new Set( [ 1, 1, 2, 2, 3, 3 ] ) ) ).to.equal( true )
        expect( new Set( [ 3, 2, 1 ] ).equals( new Set( [ 1, 2, 3 ] ) ) )
            .to.equal( true )
        expect( new Set( [ 1, 2, 3, 1, 2, 3 ] ).equals(
            new Set( [ 1, 2, 3 ] ) ) ).to.equal( true )
        expect( new Set().equals( new Set() ) ).to.equal( true )
        // unequal sets
        expect( new Set( [ 1, 2, 3 ] ).equals( new Set( [ 1, 3 ] ) ) )
            .to.equal( false )
        expect( new Set( [ 1, 3 ] ).equals( new Set( [ 3, 2, 1 ] ) ) )
            .to.equal( false )
        expect( new Set( [ 1 ] ).equals( new Set( [ 2 ] ) ) ).to.equal( false )
        expect( new Set( [ 3, 2, 1 ] ).equals( new Set( [ 'one', 2, 3 ] ) ) )
            .to.equal( false )
        expect( new Set( [ 1, 2, 3, 1 ] ).equals(
            new Set( [ 1, 2, 'three' ] ) ) ).to.equal( false )
        expect( new Set().equals( new Set( [ 'a' ] ) ) ).to.equal( false )
        expect( new Set( [ 'a' ] ).equals( new Set() ) ).to.equal( false )
    } )

    it( 'The Set.prototype.subset() function works as expected', () => {
        // some sets to test with
        const emptySet = new Set()
        const smallSet = new Set( [ 'alpha', 'beta' ] )
        const largeSet = new Set( [ 0, 1, 10, 11, 100, 101, 110, 111 ] )
        // tests
        expect( emptySet.subset( x => true ).equals( emptySet ) )
            .to.equal( true )
        expect( emptySet.subset( x => false ).equals( emptySet ) )
            .to.equal( true )
        expect( smallSet.subset( x => false ).equals( emptySet ) )
            .to.equal( true )
        expect( smallSet.subset( x => x.charAt(0)=='a' ).equals(
            new Set( [ 'alpha' ] ) ) ).to.equal( true )
        expect( largeSet.subset( x => x > 20 ).equals(
            new Set( [ 100, 101, 110, 111 ] ) ) ).to.equal( true )
        expect( largeSet.subset( x => x < 20 ).equals(
            new Set( [ 0, 1, 10, 11 ] ) ) ).to.equal( true )
        expect( largeSet.subset( x => smallSet.has( x ) ).equals( emptySet ) )
            .to.equal( true )
    } )

    it( 'The Set.prototype.union/intersection() function work', () => {
        // make several sets
        const emptySet = new Set()
        const singleton1 = new Set( [ 5 ] )
        const singleton2 = new Set( [ 'five' ] )
        const medium1 = new Set( [ 3, 4, 5 ] )
        const medium2 = new Set( [ 5, 6, 7 ] )
        const large = new Set( [ 1, 2, 3, 4, 5, 'three', 'four', 'five' ] )
        // run some tests
        expect( singleton1.intersection( singleton2 ).equals( emptySet ) )
            .to.equal( true )
        expect( singleton2.intersection( singleton1 ).equals( emptySet ) )
            .to.equal( true )
        expect( singleton1.union( singleton2 ).equals(
            new Set( [ 5, 'five' ] ) ) ).to.equal( true )
        expect( singleton2.union( singleton1 ).equals(
            new Set( [ 5, 'five' ] ) ) ).to.equal( true )
        expect( singleton1.intersection( medium1 ).equals( singleton1 ) )
            .to.equal( true )
        expect( medium1.intersection( singleton1 ).equals( singleton1 ) )
            .to.equal( true )
        expect( singleton1.union( medium1 ).equals( medium1 ) )
            .to.equal( true )
        expect( medium1.union( singleton1 ).equals( medium1 ) )
            .to.equal( true )
        expect( singleton1.intersection( medium2 ).equals( singleton1 ) )
            .to.equal( true )
        expect( medium2.intersection( singleton1 ).equals( singleton1 ) )
            .to.equal( true )
        expect( singleton1.union( medium2 ).equals( medium2 ) )
            .to.equal( true )
        expect( medium2.union( singleton1 ).equals( medium2 ) )
            .to.equal( true )
        expect( emptySet.intersection( large ).equals( emptySet ) )
            .to.equal( true )
        expect( singleton1.intersection( large ).equals( singleton1 ) )
            .to.equal( true )
        expect( singleton2.intersection( large ).equals( singleton2 ) )
            .to.equal( true )
        expect( medium1.intersection( large ).equals( medium1 ) )
            .to.equal( true )
        expect( emptySet.union( large ).equals( large ) )
            .to.equal( true )
        expect( singleton1.union( large ).equals( large ) )
            .to.equal( true )
        expect( singleton2.union( large ).equals( large ) )
            .to.equal( true )
        expect( medium1.union( large ).equals( large ) )
            .to.equal( true )
    } )

    it( 'The Set.prototype.symmetric/difference() function work', () => {
        // make several sets
        const emptySet = new Set()
        const singleton1 = new Set( [ 5 ] )
        const medium1 = new Set( [ 3, 4, 5 ] )
        const medium2 = new Set( [ 5, 6, 7 ] )
        // run some tests
        expect( medium1.difference( singleton1 ).equals( new Set( [ 3, 4 ] ) ) )
            .to.equal( true )
        expect( medium1.difference( medium2 ).equals( new Set( [ 3, 4 ] ) ) )
            .to.equal( true )
        expect( singleton1.difference( medium1 ).equals( emptySet ) )
            .to.equal( true )
        expect( medium2.difference( singleton1 ).equals( new Set( [ 6, 7 ] ) ) )
            .to.equal( true )
        expect( medium2.difference( medium1 ).equals( new Set( [ 6, 7 ] ) ) )
            .to.equal( true )
        expect( singleton1.difference( medium2 ).equals( emptySet ) )
            .to.equal( true )
        expect( medium1.symmetricDifference( singleton1 ).equals(
            new Set( [ 3, 4 ] ) ) ).to.equal( true )
        expect( medium2.symmetricDifference( singleton1 ).equals(
            new Set( [ 6, 7 ] ) ) ).to.equal( true )
        expect( medium1.symmetricDifference( medium2 ).equals(
            new Set( [ 3, 4, 6, 7 ] ) ) ).to.equal( true )
        expect( medium1.symmetricDifference( medium1 ).equals( emptySet ) )
            .to.equal( true )
    } )

    it( 'The Set.prototype.isSubset/isSuperset() function work', () => {
        // make several sets
        const empT = new Set()
        const set1 = new Set( [ 'thing' ] )
        const set2 = new Set( [ 'thing', -1000 ] )
        const set3 = new Set( [ -1000, 2000, 3000 ] )
        // run some tests of isSubset
        expect( empT.isSubset( empT ) ).to.equal( true )
        expect( empT.isSubset( set1 ) ).to.equal( true )
        expect( empT.isSubset( set2 ) ).to.equal( true )
        expect( empT.isSubset( set3 ) ).to.equal( true )
        expect( set1.isSubset( empT ) ).to.equal( false )
        expect( set1.isSubset( set1 ) ).to.equal( true )
        expect( set1.isSubset( set2 ) ).to.equal( true )
        expect( set1.isSubset( set3 ) ).to.equal( false )
        expect( set2.isSubset( empT ) ).to.equal( false )
        expect( set2.isSubset( set1 ) ).to.equal( false )
        expect( set2.isSubset( set2 ) ).to.equal( true )
        expect( set2.isSubset( set3 ) ).to.equal( false )
        expect( set3.isSubset( empT ) ).to.equal( false )
        expect( set3.isSubset( set1 ) ).to.equal( false )
        expect( set3.isSubset( set2 ) ).to.equal( false )
        expect( set3.isSubset( set3 ) ).to.equal( true )
        // run the same tests in reverse for isSuperset
        expect( empT.isSuperset( empT ) ).to.equal( true )
        expect( empT.isSuperset( set1 ) ).to.equal( false )
        expect( empT.isSuperset( set2 ) ).to.equal( false )
        expect( empT.isSuperset( set3 ) ).to.equal( false )
        expect( set1.isSuperset( empT ) ).to.equal( true )
        expect( set1.isSuperset( set1 ) ).to.equal( true )
        expect( set1.isSuperset( set2 ) ).to.equal( false )
        expect( set1.isSuperset( set3 ) ).to.equal( false )
        expect( set2.isSuperset( empT ) ).to.equal( true )
        expect( set2.isSuperset( set1 ) ).to.equal( true )
        expect( set2.isSuperset( set2 ) ).to.equal( true )
        expect( set2.isSuperset( set3 ) ).to.equal( false )
        expect( set3.isSuperset( empT ) ).to.equal( true )
        expect( set3.isSuperset( set1 ) ).to.equal( false )
        expect( set3.isSuperset( set2 ) ).to.equal( false )
        expect( set3.isSuperset( set3 ) ).to.equal( true )
    } )

} )
