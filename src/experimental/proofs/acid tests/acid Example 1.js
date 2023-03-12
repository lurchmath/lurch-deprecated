////////////////////////////////////////////////////////////////////
// Acid Test Proofs
// 
// These are the example and counterexample proofs from the END document

(<<< "Example 1 from END")
{
  (<<< "Thm: If P⇒Q then ¬P∨Q.")  
  { :(⇒ P Q) (or (¬ P) Q) }
  
  // Proof:
  { :(⇒ P Q)
    { :(¬ (or (¬ P) Q))
      { :P
         Q
         (or (¬ P) Q)
         →←
      }
      (¬ P)
      (or (¬ P) Q)
      →←
    }
    (or (¬ P) Q)
  }
  
}