import React, { useState, useEffect, useRef } from 'react';
import '../../../styles/components/factures/FactureTotauxDisplay.css';
import { useTraceUpdate } from '../../../useTraceUpdate';
// ✅ AJOUT: Import du formatter centralisé
import { formatMontant } from '../../../utils/formatters';

function FactureTotauxDisplay({
    lignes = [],
    ristourneInitiale = 0,
    readOnly = false,
    onChange = null
}) {
    
    useTraceUpdate({ lignes, ristourneInitiale, readOnly, onChange }, 'FactureTotauxDisplay');
    console.log('⭐ FactureTotauxDisplay rendu, ristourneInitiale=', ristourneInitiale);
    
    const isUpdatingFromProp = useRef(false);
    const [ristourne, setRistourne] = useState(parseFloat(ristourneInitiale) || 0);
    const [ristourneDisplay, setRistourneDisplay] = useState('');
    const isInitialValueUpdate = useRef(false);
    const debounceTimeout = useRef(null);

    // Calculer le total brut à partir des lignes
    console.log('🔍 Calcul du total brut à partir des lignes:', lignes);
    const totalBrut = lignes.reduce((sum, ligne) => {
        const ligneTotal = parseFloat(ligne.totalLigne) || 0;
        console.log(`Ligne total: ${ligne.description} = ${ligneTotal}`);
        return sum + ligneTotal;
    }, 0);
    
    // Calculer le total net (après ristourne)
    const totalNet = Math.max(0, totalBrut - ristourne);
    
    // ✅ SUPPRESSION: formatMontant local (utilise maintenant le centralisé)

    // Mise à jour quand ristourneInitiale change
    useEffect(() => {
        console.log('⭐ Effet de synchronisation ristourneInitiale:', ristourneInitiale);
        isUpdatingFromProp.current = true;
        
        // ✅ CORRECTION: Gérer le cas où ristourneInitiale est un objet ou un nombre
        let nouveauMontant = 0;
        
        if (typeof ristourneInitiale === 'object' && ristourneInitiale !== null) {
            // Si c'est un objet, extraire la propriété ristourne
            nouveauMontant = parseFloat(ristourneInitiale.ristourne) || 0;
        } else {
            // Sinon, c'est un nombre
            nouveauMontant = parseFloat(ristourneInitiale) || 0;
        }
        
        console.log('🔍 nouveauMontant extrait:', nouveauMontant);
        
        setRistourne(nouveauMontant);
        setRistourneDisplay(formatMontant(nouveauMontant));
        setTimeout(() => {
            isUpdatingFromProp.current = false;
        }, 50);
    }, [ristourneInitiale]);
    
    // Notifier le parent avec debounce
    const notifyParentWithDelay = (nouvelleRistourne) => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        
        debounceTimeout.current = setTimeout(() => {
            if (onChange && !readOnly && !isUpdatingFromProp.current) {
                console.log('⭐ Notifier le parent du changement de ristourne (avec délai):', nouvelleRistourne);
                onChange({
                    totalBrut,
                    ristourne: nouvelleRistourne,
                    totalNet: Math.max(0, totalBrut - nouvelleRistourne)
                });
            }
        }, 500);
    };

    // Nettoyer le timeout au démontage du composant
    useEffect(() => {
        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, []);
    
    // Gérer le changement de valeur de la ristourne
    const handleRistourneChange = (e) => {
        const valeurSaisie = e.target.value;
        setRistourneDisplay(valeurSaisie); // Juste afficher, pas parser
    };

    // Au blur : parser et formater
    const handleRistourneBlur = () => {
        console.log('🔍 BLUR - ristourneDisplay:', ristourneDisplay);
        
        // Nettoyer la valeur : accepter TOUS les séparateurs (virgule, point, apostrophe)
        const valeurNettoyee = ristourneDisplay
            .replace(/['\s]/g, '')  // Supprimer apostrophes et espaces
            .replace(',', '.');      // Remplacer virgule par point
        
        console.log('🔍 BLUR - valeurNettoyee:', valeurNettoyee);
        
        const nouvelleValeur = valeurNettoyee === '' ? 0 : parseFloat(valeurNettoyee) || 0;
        
        console.log('🔍 BLUR - nouvelleValeur:', nouvelleValeur);
        
        setRistourne(nouvelleValeur);
        setRistourneDisplay(formatMontant(nouvelleValeur));
        
        console.log('🔍 BLUR - après formatage:', formatMontant(nouvelleValeur));
        
        if (onChange && !readOnly) {
            onChange({
                totalBrut,
                ristourne: nouvelleValeur,
                totalNet: Math.max(0, totalBrut - nouvelleValeur)
            });
        }
    };
    
    // Suggérer une ristourne pour arrondir au franc ou à la dizaine inférieure
    const suggererRistourne = () => {
        if (ristourne > 0) return;
        
        let nouvelleRistourne = 0;
        
        const arrondirDizaine = totalBrut % 10;
        if (arrondirDizaine > 0) {
            nouvelleRistourne = arrondirDizaine;
        } else {
            const arrondirFranc = totalBrut % 1;
            if (arrondirFranc > 0) {
                nouvelleRistourne = arrondirFranc;
            }
        }
        
        setRistourne(nouvelleRistourne);
        setRistourneDisplay(formatMontant(nouvelleRistourne));
        
        if (onChange && !readOnly) {
            onChange({
                totalBrut,
                ristourne: nouvelleRistourne,
                totalNet: Math.max(0, totalBrut - nouvelleRistourne)
            });
        }
    };

    return (
        <div className="facture-section">
            <h3>Totaux de la facture</h3>
            <div className="facture-totaux-content">
                {/* Total brut */}
                <div className="facture-totaux-row">
                    <div className="facture-totaux-label">Total brut:</div>
                    <div className="facture-totaux-value">
                        <span className="montant-valeur">{formatMontant(totalBrut)}</span>
                        <span className="montant-suffix">CHF</span>
                    </div>
                </div>
                
                {/* Ristourne - conditionnelle selon readOnly */}
                {readOnly ? (
                    parseFloat(ristourne) > 0 && (
                        <div className="facture-totaux-row ristourne-row">
                            <div className="facture-totaux-label">Ristourne:</div>
                            <div className="facture-totaux-value">
                                <span className="montant-valeur">{formatMontant(ristourne)}</span>
                                <span className="montant-suffix">CHF</span>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="facture-totaux-row">
                        <div className="facture-totaux-label">
                            Ristourne:
                            {!readOnly && totalBrut > 0 && (
                                <button 
                                    type="button" 
                                    className="sugerer-ristourne-btn" 
                                    onClick={suggererRistourne}
                                    title="Suggérer une ristourne pour arrondir"
                                >
                                    ?
                                </button>
                            )}
                        </div>
                        <div className="facture-totaux-value">
                            <input
                                type="text"
                                id="ristourne"
                                value={ristourneDisplay}
                                onChange={handleRistourneChange}
                                onBlur={handleRistourneBlur}
                                onFocus={(e) => {
                                    if (parseFloat(ristourne) === 0 && totalBrut > 0) {
                                        suggererRistourne();
                                    }
                                    e.target.select();
                                }}
                                disabled={readOnly}
                            />
                            <span className="montant-suffix">CHF</span>
                        </div>
                    </div>
                )}
                
                {/* Total net */}
                <div className="facture-totaux-row total-final">
                    <div className="facture-totaux-label">Total net:</div>
                    <div className="facture-totaux-value">
                        <span className="montant-valeur">{formatMontant(totalNet)}</span>
                        <span className="montant-suffix">CHF</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FactureTotauxDisplay;