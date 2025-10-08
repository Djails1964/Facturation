import React from 'react';
import { FiClipboard } from 'react-icons/fi';
import DateInputField from '../../shared/DateInputField';
import { formatMontant } from '../../../utils/formatters';

// CORRECTION : Import correct depuis FactureUIComponents
import { ReadOnlyField } from '../../shared/FactureUIComponents';

/**
 * Utilitaires pour l'extraction des valeurs depuis les objets enrichis
 * NOUVELLE APPROCHE : Préservation des objets enrichis + extraction propre
 */
const EnrichedObjectHelpers = {
    /**
     * Extrait le nom d'affichage d'un service depuis l'objet enrichi
     */
    getServiceDisplayName: (ligne) => {
        if (ligne.service && typeof ligne.service === 'object') {
            return ligne.service.nomService || ligne.service.codeService || ligne.service.nom || 'Service inconnu';
        }
        if (ligne.serviceType) {
            return ligne.serviceType;
        }
        return 'Service non défini';
    },

    /**
     * Extrait le code service pour les contrôles de formulaire
     */
    getServiceCode: (ligne) => {
        if (ligne.service && typeof ligne.service === 'object') {
            return ligne.service.codeService || ligne.service.code || '';
        }
        return ligne.serviceType || '';
    },

    /**
     * Extrait le nom d'affichage d'une unité depuis l'objet enrichi
     */
    getUniteDisplayName: (ligne) => {
        console.log('getUniteDisplayName - ligne:', ligne);
        
        if (ligne.unite && typeof ligne.unite === 'object') {
            return ligne.unite.nomUnite || ligne.unite.codeUnite || 'Unité inconnue';
        }
        if (typeof ligne.unite === 'string') {
            return ligne.unite;
        }
        return 'Unité non définie';
    },

    /**
     * Extrait le code unité pour les contrôles de formulaire
     */
    getUniteCode: (ligne) => {
        if (ligne.unite && typeof ligne.unite === 'object') {
            return ligne.unite.codeUnite || ligne.unite.nomUnite || '';
        }
        if (typeof ligne.unite === 'string') {
            return ligne.unite;
        }
        return '';
    },

    /**
     * Reconstruit l'objet ligne avec les valeurs correctes pour les selects
     * SANS perdre les objets enrichis
     */
    prepareForFormControls: (ligne) => {
        return {
            ...ligne,
            // Conserver les objets enrichis
            serviceEnrichi: ligne.service,
            uniteEnrichie: ligne.unite,
            // Ajouter les codes pour les contrôles
            serviceTypeCode: EnrichedObjectHelpers.getServiceCode(ligne),
            uniteCode: EnrichedObjectHelpers.getUniteCode(ligne)
        };
    }
};

/**
 * Composant pour les champs de saisie d'une ligne de facture
 * VERSION AVEC PRÉSERVATION DES OBJETS ENRICHIS
 */
function LigneFactureFields({
    ligne,
    index,
    services,
    unites,
    unitesByService,
    focusedFields,
    validationErrors,
    prixModifiesManuel,
    readOnly,
    serviceNom,
    uniteNom,
    client,
    onModify,
    onInsertUniteName,
    onFocus,
    onBlur,
    getErrorClass
}) {
    // Préparer la ligne pour l'affichage/édition
    const lignePreparee = EnrichedObjectHelpers.prepareForFormControls(ligne);

    if (readOnly) {
        return (
            <ReadOnlyFields
                ligne={lignePreparee}
                serviceNom={EnrichedObjectHelpers.getServiceDisplayName(ligne)}
                uniteNom={EnrichedObjectHelpers.getUniteDisplayName(ligne)}
            />
        );
    }

    return (
        <EditableFields
            ligne={lignePreparee}
            index={index}
            services={services}
            unites={unites}
            unitesByService={unitesByService}
            focusedFields={focusedFields}
            validationErrors={validationErrors}
            prixModifiesManuel={prixModifiesManuel}
            client={client}
            onModify={onModify}
            onInsertUniteName={onInsertUniteName}
            onFocus={onFocus}
            onBlur={onBlur}
            getErrorClass={getErrorClass}
        />
    );
}

/**
 * Champs en mode lecture seule - UTILISE LES OBJETS ENRICHIS
 */
function ReadOnlyFields({ ligne, serviceNom, uniteNom }) {
    return (
        <>
            {/* Première ligne - Service et Unité */}
            <div className="fdf_table-row fdf_equal-columns">
                <div className="fdf_table-cell fdf_service-col">
                    <ReadOnlyField label="Type de service" value={serviceNom} />
                </div>
                <div className="fdf_table-cell fdf_unite-col">
                    <ReadOnlyField label="Unité" value={uniteNom} />
                </div>
            </div>
            
            {/* Deuxième ligne - Description */}
            <div className="fdf_table-row fdf_description-row">
                <div className="fdf_table-cell fdf_description-col fdf_full-width">
                    <ReadOnlyField label="Description" value={ligne.description} />
                </div>
            </div>
            
            {/* Troisième ligne - Dates (si présent) */}
            {ligne.descriptionDates && (
                <div className="fdf_table-row fdf_description-row">
                    <div className="fdf_table-cell fdf_description-col fdf_full-width">
                        <ReadOnlyField label="Dates" value={ligne.descriptionDates} />
                    </div>
                </div>
            )}
            
            {/* Quatrième ligne - Quantité, Prix, Total */}
            <div className="fdf_table-row fdf_numeric-row">
                <div className="fdf_table-cell fdf_quantity-col">
                    <ReadOnlyField label="Quantité" value={ligne.quantite} className="text-right" />
                </div>
                <div className="fdf_table-cell fdf_price-col">
                    <ReadOnlyField label="Prix unitaire" value={formatMontant(ligne.prixUnitaire)} className="text-right" />
                </div>
                <div className="fdf_table-cell fdf_total-col">
                    <ReadOnlyField label="Total" value={formatMontant(ligne.totalLigne)} className="text-right" />
                </div>
            </div>
        </>
    );
}

/**
 * Champs en mode édition - PRÉSERVE LES OBJETS ENRICHIS
 */
function EditableFields({
    ligne,
    index,
    services,
    unites,
    unitesByService,
    focusedFields,
    validationErrors,
    prixModifiesManuel,
    client,
    onModify,
    onInsertUniteName,
    onFocus,
    onBlur,
    getErrorClass
}) {
    return (
        <>
            {/* Première ligne - Service et Unité */}
            <div className="fdf_table-row fdf_equal-columns">
                <div className="fdf_table-cell fdf_service-col">
                    <ServiceTypeSelect
                        ligne={ligne}
                        index={index}
                        services={services}
                        unites={unites}                    // ✅ AJOUT
                        unitesByService={unitesByService}  // ✅ AJOUT
                        focusedFields={focusedFields}
                        validationErrors={validationErrors}
                        onModify={onModify}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        getErrorClass={getErrorClass}
                    />
                </div>
                
                <div className="fdf_table-cell fdf_unite-col">
                    <UniteSelect
                        ligne={ligne}
                        index={index}
                        unites={unites}
                        unitesByService={unitesByService}
                        focusedFields={focusedFields}
                        validationErrors={validationErrors}
                        client={client}
                        onModify={onModify}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        getErrorClass={getErrorClass}
                    />
                </div>
            </div>
            
            {/* Deuxième ligne - Description avec dates */}
            <div className="fdf_table-row fdf_description-row">
                <div className="fdf_table-cell fdf_description-col fdf_full-width">
                    <DescriptionInputGroup
                        ligne={ligne}
                        index={index}
                        focusedFields={focusedFields}
                        validationErrors={validationErrors}
                        onModify={onModify}
                        onInsertUniteName={onInsertUniteName}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        getErrorClass={getErrorClass}
                    />
                </div>
            </div>
            
            {/* Troisième ligne - Quantité, Prix, Total */}
            <div className="fdf_table-row fdf_numeric-row">
                <div className="fdf_table-cell fdf_quantity-col">
                    <QuantiteInput
                        ligne={ligne}
                        index={index}
                        focusedFields={focusedFields}
                        validationErrors={validationErrors}
                        onModify={onModify}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        getErrorClass={getErrorClass}
                    />
                </div>
                
                <div className="fdf_table-cell fdf_price-col">
                    <PrixUnitaireInput
                        ligne={ligne}
                        index={index}
                        focusedFields={focusedFields}
                        validationErrors={validationErrors}
                        prixModifiesManuel={prixModifiesManuel}
                        onModify={onModify}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        getErrorClass={getErrorClass}
                    />
                </div>
                
                <div className="fdf_table-cell fdf_total-col">
                    <TotalInput
                        ligne={ligne}
                        index={index}
                        focusedFields={focusedFields}
                        onFocus={onFocus}
                        onBlur={onBlur}
                    />
                </div>
            </div>
        </>
    );
}

/**
 * Sélecteur de type de service - PRÉSERVE L'OBJET SERVICE ENRICHI
 */
function ServiceTypeSelect({
    ligne,
    index,
    services,
    unites,
    unitesByService,
    focusedFields,
    validationErrors,
    onModify,
    onFocus,
    onBlur,
    getErrorClass
}) {
    const errorClass = getErrorClass('serviceType');
    
    // Utiliser le code extrait pour le contrôle
    const currentValue = ligne.serviceTypeCode || '';
    const hasValue = currentValue !== undefined && currentValue !== '';
    
    /**
     * Gestionnaire de changement qui sélectionne automatiquement l'unité par défaut
     */
    const handleServiceChange = async (e) => {
        const serviceCode = e.target.value;
        
        console.log('🔄 Changement de service vers:', serviceCode);
        
        // Trouver l'objet service complet
        const serviceObj = services.find(s => s && s.codeService === serviceCode);
        
        if (serviceObj) {
            console.log('✅ Service trouvé:', serviceObj);
            
            // Mettre à jour le service
            onModify(index, 'service', serviceObj);
            onModify(index, 'serviceType', serviceCode);
            onModify(index, 'idService', serviceObj.idService);
            
            console.log('🔍 DEBUG MAPPING:', unitesByService);
            console.log('🔍 DEBUG SITEWEB:', unitesByService?.SiteWeb);
            console.log('🔍 DEBUG UNITES ARRAY:', unites?.map(u => u.codeUnite));
            // ✅ CORRECTION: Vérifier que unites existe avant de l'utiliser
            if (unites && Array.isArray(unites) && unites.length > 0) {
                await selectDefaultUniteForService(serviceObj, serviceCode);
            } else {
                console.warn('⚠️ Aucune unité disponible pour la sélection automatique');
                // Nettoyer l'unité actuelle
                onModify(index, 'unite', null);
                onModify(index, 'uniteCode', '');
                onModify(index, 'idUnite', null);
            }
        } else {
            // Nettoyer si pas de service trouvé
            onModify(index, 'service', null);
            onModify(index, 'serviceType', serviceCode);
            onModify(index, 'idService', null);
            
            // Nettoyer aussi l'unité
            onModify(index, 'unite', null);
            onModify(index, 'uniteCode', '');
            onModify(index, 'idUnite', null);
        }
    };
    
    /**
     * ✅ FONCTION CORRIGÉE: Sélectionne automatiquement l'unité par défaut pour un service
     */
    const selectDefaultUniteForService = async (serviceObj, serviceCode) => {
        console.log('🔍 Recherche unité par défaut pour service:', serviceCode);
        console.log('🔍 Unités disponibles:', unites?.length || 0);
        console.log('🔍 Mapping unitesByService:', unitesByService);
        
        // ✅ CORRECTION: Vérifications de sécurité
        if (!unites || !Array.isArray(unites) || unites.length === 0) {
            console.warn('⚠️ Pas d\'unités disponibles');
            return;
        }
        
        if (!serviceObj || !serviceObj.idService) {
            console.warn('⚠️ Service invalide');
            return;
        }
        
        // ✅ CORRECTION: Prioriser le mapping unitesByService
        if (unitesByService && unitesByService[serviceCode]?.length > 0) {
            const premierCodeUnite = unitesByService[serviceCode][0];
            console.log('🔍 Code unité depuis mapping:', premierCodeUnite);
            
            const uniteObj = unites.find(u => 
                u && (u.codeUnite === premierCodeUnite || u.code === premierCodeUnite)
            );
            
            if (uniteObj) {
                console.log('✅ Unité trouvée via mapping:', uniteObj);
                applyUniteSelection(uniteObj);
                return;
            } else {
                console.warn('⚠️ Unité non trouvée pour le code:', premierCodeUnite, 'dans:', unites.map(u => u.codeUnite || u.code));
            }
        }
        
        // Méthode 2: Chercher dans les unités avec isDefault = true pour ce service
        const uniteParDefaut = unites.find(u => 
            u && u.idService === serviceObj.idService && u.isDefault === true
        );
        
        if (uniteParDefaut) {
            console.log('✅ Unité par défaut trouvée via isDefault:', uniteParDefaut);
            applyUniteSelection(uniteParDefaut);
            return;
        }
        
        // Méthode 3: Prendre la première unité disponible pour ce service
        const unitesDisponibles = unites.filter(u => 
            u && u.idService === serviceObj.idService
        );
        
        if (unitesDisponibles.length > 0) {
            console.log('✅ Première unité disponible trouvée:', unitesDisponibles[0]);
            applyUniteSelection(unitesDisponibles[0]);
            return;
        }
        
        console.warn('⚠️ Aucune unité trouvée pour le service:', serviceCode);
        console.log('🔍 Debug - serviceObj.idService:', serviceObj.idService);
        console.log('🔍 Debug - unites avec idService:', unites.filter(u => u.idService).map(u => ({code: u.codeUnite || u.code, idService: u.idService})));
        
        // Nettoyer l'unité si aucune trouvée
        onModify(index, 'unite', null);
        onModify(index, 'uniteCode', '');
        onModify(index, 'idUnite', null);
    };
    
    /**
     * ✅ FONCTION CORRIGÉE: Applique la sélection d'une unité
     */
    const applyUniteSelection = (uniteObj) => {
        if (!uniteObj) {
            console.warn('⚠️ Objet unité invalide');
            return;
        }
        
        console.log('🎯 Application de l\'unité:', uniteObj);
        
        // Mettre à jour l'objet unité enrichi
        onModify(index, 'unite', uniteObj);
        onModify(index, 'uniteCode', uniteObj.codeUnite || uniteObj.code);
        onModify(index, 'idUnite', uniteObj.idUnite || uniteObj.id);
        
        // Forcer la mise à jour de l'UI
        setTimeout(() => {
            const uniteSelect = document.getElementById(`unite-${index}`);
            if (uniteSelect) {
                const codeUnite = uniteObj.codeUnite || uniteObj.code;
                uniteSelect.value = codeUnite;
                
                // Déclencher l'événement change pour mettre à jour l'état du label
                const event = new Event('change', { bubbles: true });
                uniteSelect.dispatchEvent(event);
                
                // Marquer le champ comme ayant une valeur
                if (uniteSelect.parentElement) {
                    uniteSelect.parentElement.classList.add('has-value');
                }
                
                console.log('🎯 UI mise à jour pour unité:', codeUnite);
            } else {
                console.warn('⚠️ Element select unité non trouvé:', `unite-${index}`);
            }
        }, 100);
    };
    
    return (
        <div className={`fdf_floating-label-input ${focusedFields[`serviceType-${index}`] ? 'fdf_focused' : ''} ${hasValue ? 'has-value' : ''}`}>
            <select 
                id={`serviceType-${index}`}
                value={currentValue}
                onChange={handleServiceChange}
                onFocus={() => onFocus(index, 'serviceType')}
                onBlur={() => onBlur(index, 'serviceType', currentValue)}
                className={`fdf_form-control ${errorClass}`}
                required
            >
                <option value="">Sélectionner un service</option>
                {services
                    .filter(service => service && service.idService && service.codeService && service.nomService)
                    .map(service => (
                        <option 
                            key={`service-${service.idService}`} 
                            value={service.codeService}
                        >
                            {service.nomService}
                        </option>
                    ))
                }
            </select>
            <label htmlFor={`serviceType-${index}`}>
                Type de service <span className="fdf_required">*</span>
            </label>
            {validationErrors[index]?.serviceType && (
                <div className="fdf_error-message">
                    {validationErrors[index].serviceType}
                </div>
            )}
        </div>
    );
}

/**
 * Sélecteur d'unité - PRÉSERVE L'OBJET UNITÉ ENRICHI
 */
function UniteSelect({
    ligne,
    index,
    unites,
    unitesByService,
    focusedFields,
    validationErrors,
    client,
    onModify,
    onFocus,
    onBlur,
    getErrorClass
}) {
    const errorClass = getErrorClass('unite');
    
    console.log('--- UniteSelect Rendu ---');
    console.log('🔍 Rendu UniteSelect - Ligne:', index, 'Unité actuelle:', ligne.unite, 'Code unité:', ligne.uniteCode);
    console.log('🔍 Unités disponibles:', unites);
    console.log('🔍 Unités par service:', unitesByService);
    console.log('🔍 Client:', client);
    console.log('🔍 Ligne complète:', ligne);
    // NOUVELLE APPROCHE : Utiliser le code extrait pour le contrôle
    const currentValue = ligne.unite?.codeUnite || '';
    const hasValue = currentValue !== undefined && currentValue !== '';
    
    // Extraire le service code pour filtrer les unités
    const currentServiceType = ligne.serviceTypeCode || '';
    
    /**
     * Gestionnaire de changement qui préserve l'objet unité enrichi
     */
    const handleUniteChange = async (e) => {
        const uniteValue = e.target.value;
        console.log('🔄 Changement d\'unité:', uniteValue);

        // Trouver l'objet unite complet
        const uniteObj = unites.find(u => u && (u.codeUnite === uniteValue || u.code === uniteValue));

        if (uniteObj) {
            console.log('✅ Objet unité trouvé:', uniteObj);
            
            // ✅ CORRECTION PRINCIPALE: Mise à jour SYNCHRONE ET GROUPÉE
            // 1. Mettre à jour l'objet unité enrichi
            onModify(index, 'unite', uniteObj);
            
            // 2. Mettre à jour immédiatement le code et l'ID
            onModify(index, 'uniteCode', uniteObj.codeUnite || uniteObj.code);
            onModify(index, 'idUnite', uniteObj.idUnite);
            
            console.log('✅ Unité mise à jour:', {
                code: uniteObj.codeUnite || uniteObj.code,
                id: uniteObj.idUnite,
                nom: uniteObj.nomUnite || uniteObj.nom
            });
        } else {
            console.warn('❌ Unité non trouvée pour le code:', uniteValue);
            // Nettoyer si pas d'unité trouvée
            onModify(index, 'unite', null);
            onModify(index, 'uniteCode', null);
            onModify(index, 'idUnite', null);
        }
    };
    
    return (
        <div className={`fdf_floating-label-input ${focusedFields[`unite-${index}`] ? 'fdf_focused' : ''} ${hasValue ? 'has-value' : ''}`}>
            <select
                id={`unite-${index}`}
                value={currentValue}
                onChange={handleUniteChange}
                onFocus={() => onFocus(index, 'unite')}
                onBlur={() => onBlur(index, 'unite', currentValue)}
                disabled={!currentServiceType}
                className={`fdf_form-control ${errorClass}`}
                required
            >
                <option key="default" value="">Sélectionnez une unité</option>
                {getUniteOptions(ligne, unites, unitesByService)}
            </select>
            <label htmlFor={`unite-${index}`}>
                Unité <span className="fdf_required">*</span>
            </label>
            {validationErrors[index]?.unite && (
                <div className="fdf_error-message">
                    {validationErrors[index].unite}
                </div>
            )}
        </div>
    );
}

/**
 * Groupe description avec champ dates intégré - UTILISE L'OBJET UNITÉ ENRICHI
 */
function DescriptionInputGroup({
    ligne,
    index,
    focusedFields,
    validationErrors,
    onModify,
    onInsertUniteName,
    onFocus,
    onBlur,
    getErrorClass
}) {
    const errorClass = getErrorClass('description');
    const hasDescriptionValue = ligne.description !== undefined && ligne.description !== '';
    
    // NOUVELLE APPROCHE : Utiliser l'objet unité enrichi pour le nom
    const currentUniteCode = ligne.codeUnite || '';
    const isClipboardDisabled = !ligne.unite || 
                                (typeof ligne.unite === 'object' && (!ligne.unite.nom && !ligne.unite.nomUnite)) ||
                                (typeof ligne.unite === 'string' && !ligne.unite);
    
    const charactersUsed = (ligne.description || '').length;
    const charactersRemaining = 200 - charactersUsed;
    
    return (
        <div className="fdf_description-group">
            {/* Description principale */}
            <div className={`fdf_floating-label-input ${focusedFields[`description-${index}`] ? 'fdf_focused' : ''} ${hasDescriptionValue ? 'has-value' : ''}`}>
                <input
                    type="text"
                    id={`description-${index}`}
                    value={ligne.description || ''}
                    onChange={(e) => {
                        const newValue = e.target.value.slice(0, 200);
                        onModify(index, 'description', newValue);
                    }}
                    onFocus={() => onFocus(index, 'description')}
                    onBlur={() => onBlur(index, 'description', ligne.description)}
                    className={`fdf_form-control ${errorClass}`}
                    placeholder=" "
                    maxLength="200"
                    required
                />
                <label htmlFor={`description-${index}`}>
                    Description <span className="fdf_required">*</span>
                </label>
                
                {/* Icône Clipboard */}
                <FiClipboard
                    className={`fdf_clipboard-icon ${isClipboardDisabled ? 'fdf_icon-disabled' : ''}`}
                    onClick={() => !isClipboardDisabled && onInsertUniteName && onInsertUniteName(index)}
                    title={isClipboardDisabled ? "Veuillez d'abord sélectionner une unité" : "Copier le nom de l'unité en début de description"}
                />
                
                {validationErrors[index]?.description && (
                    <div className="fdf_error-message">
                        {validationErrors[index].description}
                    </div>
                )}
                
                {/* Compteur de caractères */}
                <div className="fdf_char-limit-info" style={{
                    position: 'absolute',
                    right: '0',
                    bottom: validationErrors[index]?.description ? '-40px' : '-20px',
                    fontSize: '0.75rem',
                    color: charactersRemaining < 20 ? '#d32f2f' : '#666'
                }}>
                    {charactersRemaining} caractère{charactersRemaining !== 1 ? 's' : ''} restant{charactersRemaining !== 1 ? 's' : ''}
                </div>
            </div>
            
            {/* Champ dates */}
            <DateInputField
                id={`descriptionDates-${index}`}
                label="Dates"
                value={ligne.descriptionDates || ''}
                onChange={(valueOrEvent) => {
                    if (typeof valueOrEvent === 'string') {
                        onModify(index, 'descriptionDates', valueOrEvent);
                    } else if (valueOrEvent && valueOrEvent.target) {
                        onModify(index, 'descriptionDates', valueOrEvent.target.value);
                    }
                }}
                updateQuantity={(formattedDates, count) => {
                    onModify(index, 'descriptionDates', formattedDates);
                    onModify(index, 'quantite', count);
                    onFocus(index, 'descriptionDates');
                    
                    setTimeout(() => {
                        const quantiteInput = document.getElementById(`quantite-${index}`);
                        if (quantiteInput && quantiteInput.parentElement) {
                            quantiteInput.parentElement.classList.add('has-value');
                        }
                    }, 10);
                }}
                readOnly={false}
                maxLength={100}
                showCharCount={true}
                multiSelect={true}
                required={false}
            />
        </div>
    );
}

/**
 * Champ quantité
 */
function QuantiteInput({
    ligne,
    index,
    focusedFields,
    validationErrors,
    onModify,
    onFocus,
    onBlur,
    getErrorClass
}) {
    const errorClass = getErrorClass('quantite');
    const hasValue = ligne.quantite !== undefined && ligne.quantite !== '';
    
    return (
        <div className={`fdf_floating-label-input ${focusedFields[`quantite-${index}`] ? 'fdf_focused' : ''} ${hasValue ? 'has-value' : ''}`}>
            <input
                type="number"
                id={`quantite-${index}`}
                value={ligne.quantite}
                onChange={(e) => onModify(
                    index, 
                    'quantite', 
                    e.target.value === '' ? '' : parseFloat(e.target.value)
                )}
                onFocus={() => onFocus(index, 'quantite')}
                onBlur={() => onBlur(index, 'quantite', ligne.quantite)}
                min="0"
                step="0.01"
                className={`fdf_form-control fdf_text-right ${errorClass}`}
                placeholder=" "
                required
            />
            <label htmlFor={`quantite-${index}`}>
                Quantité <span className="fdf_required">*</span>
            </label>
            {validationErrors[index]?.quantite && (
                <div className="fdf_error-message">
                    {validationErrors[index].quantite}
                </div>
            )}
        </div>
    );
}

/**
 * Champ prix unitaire
 */
function PrixUnitaireInput({
    ligne,
    index,
    focusedFields,
    validationErrors,
    prixModifiesManuel,
    onModify,
    onFocus,
    onBlur,
    getErrorClass
}) {
    const isPriceModified = prixModifiesManuel.current[index];
    const errorClass = getErrorClass('prixUnitaire');
    const hasValue = ligne.prixUnitaire !== undefined && ligne.prixUnitaire !== '';
    
    return (
        <div className={`fdf_floating-label-input ${focusedFields[`prixUnitaire-${index}`] ? 'fdf_focused' : ''} ${isPriceModified ? 'fdf_price-modified' : ''} ${hasValue ? 'has-value' : ''}`}>
            <input
                type="number"
                id={`prixUnitaire-${index}`}
                value={ligne.prixUnitaire}
                onChange={(e) => {
                    const newPrice = e.target.value === '' ? '' : parseFloat(e.target.value);
                    onModify(index, 'prixUnitaire', newPrice);
                }}
                onFocus={() => onFocus(index, 'prixUnitaire')}
                onBlur={() => onBlur(index, 'prixUnitaire', ligne.prixUnitaire)}
                min="0"
                step="0.01"
                className={`fdf_form-control fdf_text-right ${errorClass}`}
                placeholder=" "
                required
            />
            <label htmlFor={`prixUnitaire-${index}`}>
                Prix unitaire <span className="fdf_required">*</span>
            </label>
            <span className="fdf_currency-suffix">CHF</span>
            {validationErrors[index]?.prixUnitaire && (
                <div className="fdf_error-message">
                    {validationErrors[index].prixUnitaire}
                </div>
            )}
        </div>
    );
}

/**
 * Champ total (lecture seule)
 */
function TotalInput({ ligne, index, focusedFields, onFocus, onBlur }) {
    const hasValue = ligne.totalLigne !== undefined && ligne.totalLigne !== '' && ligne.totalLigne !== 0;

    return (
        <div className={`fdf_floating-label-input ${focusedFields[`total-${index}`] ? 'fdf_focused' : 'fdf_filled'} ${hasValue ? 'has-value' : ''}`}>
            <input
                type="text"
                id={`total-${index}`}
                value={`${formatMontant(ligne.totalLigne)} CHF`}
                readOnly
                onFocus={() => onFocus(index, 'total')}
                onBlur={() => onBlur(index, 'total', ligne.totalLigne)}
                className="fdf_form-control fdf_text-right"
                placeholder=" "
            />
            <label htmlFor={`total-${index}`}>Total</label>
        </div>
    );
}

/**
 * Génère les options d'unités selon le service sélectionné - UTILISE LES OBJETS ENRICHIS
 */
function getUniteOptions(ligne, unites, unitesByService) {
    // Extraction du service depuis l'objet enrichi
    const currentServiceType = ligne.serviceTypeCode || '';
    
    console.log('🔍 getUniteOptions - Service:', currentServiceType);
    console.log('🔍 getUniteOptions - Unités disponibles:', unites);
    console.log('🔍 getUniteOptions - Mapping par service:', unitesByService);
    
    // if (!currentServiceType) {
    //     return getFallbackOptions();
    // }
    
    // ✅ CORRECTION PRINCIPALE: Filtrer les unités par service en utilisant les vrais noms de champs
    const unitesForService = unites.filter(unite => {
        if (!unite || !ligne.service) return false;
        // Vérifier si l'unité appartient au service sélectionné
        const belongsToService = unite.idService === ligne.idService || 
                                 unite.idService === ligne.idService ||
                                 (ligne.service && unite.idService === ligne.service.idService);
        
        console.log(`🔍 Unité ${unite.nomUnite} (${unite.codeUnite}) appartient au service ${currentServiceType}:`, belongsToService);
        return belongsToService;
    });
    
    console.log('✅ Unités filtrées pour le service:', unitesForService);
    
    if (unitesForService.length > 0) {
        return unitesForService.map((unite, index) => (
            <option 
                key={`unite-${unite.idUnite}-${index}`} // ✅ CORRECTION: Clé unique avec l'ID
                value={unite.codeUnite}
            >
                {unite.nomUnite}
            </option>
        ));
    }
    
    // ✅ CORRECTION: Vérifier si nous avons des unités pré-mappées pour ce service
    if (unitesByService && unitesByService[currentServiceType] && unitesByService[currentServiceType].length > 0) {
        // Filtrer les doublons du mapping
        const uniqueCodes = [...new Set(unitesByService[currentServiceType])];
        
        const options = uniqueCodes.map((uniteCode, index) => {
            const uniteObj = unites.find(u => u.codeUnite === uniteCode || u.code === uniteCode);
            
            return (
                <option 
                    key={`mapped-unite-${uniteCode}-${index}`} // ✅ CORRECTION: Clé unique
                    value={uniteCode}
                >
                    {uniteObj?.nomUnite || uniteObj?.nom || uniteCode}
                </option>
            );
        }).filter(option => option !== null);
        
        if (options.length > 0) {
            console.log('✅ Options créées depuis le mapping:', options.length);
            return options;
        }
    }
    
    // Fallback pour service spécifique
    // if (currentServiceType === 'LocationSalle') {
    //     return [
    //         <option key="heure-fallback" value="Heure">Heure</option>,
    //         <option key="demijour-fallback" value="DemiJour">Demi-journée</option>,
    //         <option key="jour-fallback" value="Jour">Journée</option>,
    //         <option key="soiree-fallback" value="Soiree">Soirée</option>,
    //         <option key="weekend-fallback" value="Weekend">Weekend</option>
    //     ];
    // }
    
    // return getFallbackOptions();
}

/**
 * Options d'unités par défaut - VERSION CORRIGÉE
 */
// function getFallbackOptions() {
//     return [
//         <option key="heure-default" value="Heure">Heure</option>,
//         <option key="journee-default" value="Journee">Journée</option>,
//         <option key="forfait-default" value="Forfait">Forfait</option>
//     ];
// }

export default LigneFactureFields;