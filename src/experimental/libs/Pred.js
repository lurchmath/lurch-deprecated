////////////////////////////////////////////////////////////////////////////
// Lurch Lib
//

  ////////////////////////////////
  // ND Predicate Logic Axioms
  ////////////////////////////////
{
  :[ ∀ ∃ = ∃! ]
  :{ :(∀ x,(@ P x)) (@ P t) }           // ∀-
  :{ :{ :[x] (@ P x) }  (∀ y,(@ P y)) } // ∀+
  :{ :(∃ x , (@ P x)) [c , (@ P c)] }   // ∃-
  :{ :(@ P t) (∃ x,(@ P x)) }           // ∃+
  :{ :(= x y) :(@ P x) (@ P y) }        // substitution
  :{ (= W W) }                          // reflexive =
  :{ (∃! x, (@ P x)) ≡                  // ∃!
     { (∃ x , (and (@ P x) (∀ y, (⇒ (@ P y) (= y x))))) } 
   }                                    
} 