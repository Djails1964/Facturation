// FactureTotauxDisplay.js
import React, { useState, useEffect, useRef } from 'react';
import './FactureTotauxDisplay.css';
import { useTraceUpdate } from './useTraceUpdate'; // Importer le hook de traçage

function FactureTotauxDisplay({
    lignes = [],                   // Tableau des lignes de facture
    ristourneInitiale = 0,         // Valeur initiale de la ristourne
    readOnly = false,              // Mode lecture seule
    onChange = null                // Callback pour notifier le parent des changements
}) {
    
    useTraceUpdate({ lignes, ristourneInitiale, readOnly, onChange }, 'FactureTotauxDisplay');
    console.log('⭐ FactureTotauxDisplay rendu, ristourneInitiale=', ristourneInitiale);
    
    const isUpdatingFromProp = useRef(false);
    const [ristourne, setRistourne] = useState(parseFloat(ristourneInitiale) || 0);
    const [ristourneDisplay, setRistourneDisplay] = useState(''); // Valeur affichée dans l'input
    const isInitialValueUpdate = useRef(false);
    const debounceTimeout = useRef(null);

    // Calculer le total brut à partir des lignes
    const totalBrut = lignes.reduce((sum, ligne) => {
        const ligneTotal = parseFloat(ligne.total) || 0;
        console.log(`Ligne total: ${ligne.description} = ${ligneTotal}`);
        return sum + ligneTotal;
    }, 0);
    
    // Calculer le total net (après ristourne)
    const totalNet = Math.max(0, totalBrut - ristourne);
    
    // Fonction pour formater les montants
    const formatMontant = (montant) => {
        return new Intl.NumberFormat('fr-CH', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        }).format(parseFloat(montant) || 0);
    };

    // Formater la valeur de ristourne pour l'affichage avec 2 décimales
    const formatRistourneInput = (valeur) => {
        return new Intl.NumberFormat('fr-CH', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: false
        }).format(parseFloat(valeur) || 0);
    };
    
    // Mise à jour quand ristourneInitiale change
    useEffect(() => {
        console.log('⭐ Effet de synchronisation ristourneInitiale:', ristourneInitiale);
        isUpdatingFromProp.current = true;
        const nouveauMontant = parseFloat(ristourneInitiale) || 0;
        setRistourne(nouveauMontant);
        setRistourneDisplay(formatRistourneInput(nouveauMontant));
        setTimeout(() => {
            isUpdatingFromProp.current = false;
        }, 50);
    }, [ristourneInitiale]);
    
    // Notifier le parent avec debounce
    const notifyParentWithDelay = (nouvelleRistourne) => {
        // Annuler le timeout précédent s'il existe
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        
        // Programmer la notification après 500ms de pause dans la saisie
        debounceTimeout.current = setTimeout(() => {
            if (onChange && !readOnly && !isUpdatingFromProp.current) {
                console.log('⭐ Notifier le parent du changement de ristourne (avec délai):', nouvelleRistourne);
                onChange({
                    totalBrut,
                    ristourne: nouvelleRistourne,
                    totalNet: Math.max(0, totalBrut - nouvelleRistourne)
                });
            }
        }, 500); // Délai de 500ms
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
        
        // Mettre à jour immédiatement l'affichage
        setRistourneDisplay(valeurSaisie);
        
        // Convertir pour les calculs internes
        const valeurNumerique = valeurSaisie.replace(',', '.');
        const nouvelleValeur = valeurNumerique === '' ? 0 : parseFloat(valeurNumerique);
        
        if (!isNaN(nouvelleValeur)) {
            setRistourne(nouvelleValeur);
            
            // Notifier le parent avec délai
            notifyParentWithDelay(nouvelleValeur);
        }
    };

    // Gérer la perte de focus pour formater correctement
    const handleRistourneBlur = () => {
        // Formater la valeur affichée quand l'utilisateur sort du champ
        setRistourneDisplay(formatRistourneInput(ristourne));
        
        // Forcer la notification immédiate si pas encore envoyée
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
            if (onChange && !readOnly && !isUpdatingFromProp.current) {
                onChange({
                    totalBrut,
                    ristourne,
                    totalNet: Math.max(0, totalBrut - ristourne)
                });
            }
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
        setRistourneDisplay(formatRistourneInput(nouvelleRistourne));
        
        // Notification immédiate pour les suggestions (pas de délai)
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
                                    // Suggestion automatique au focus si ristourne est à 0
                                    if (parseFloat(ristourne) === 0 && totalBrut > 0) {
                                        suggererRistourne();
                                    }
                                    // Sélectionner tout le texte lors du focus
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