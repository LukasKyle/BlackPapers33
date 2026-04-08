
import React, { useState } from 'react';
import { X, CheckCircle, Shield, AlertTriangle } from 'lucide-react';

export const ConsultationModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-primary/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Correction & Validation
            </h2>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6 text-gray-300">
            <div className="bg-secondary p-4 rounded border-l-4 border-primary">
              <h3 className="text-white font-semibold mb-2">Compris : Plateforme de Contenu (Pas d'Exchange)</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Concept :</strong> "Watch-me-trade". C'est un journal de bord privé, pas une plateforme d'exécution.</li>
                <li><strong>Modification majeure :</strong> J'ai retiré les termes ambigus comme "Zéro KYC" (terme d'exchange) ou "Tradez avec moi" pour les remplacer par des termes liés à l'accès VIP et au divertissement.</li>
                <li><strong>Objectif :</strong> Les utilisateurs paient pour <em>voir</em>, s'inspirer et apprendre, pas pour cliquer sur "Acheter" ici.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Ajustements Réalisés
              </h3>
              <div className="space-y-3">
                <div className="bg-[#1e1e1e] p-3 rounded">
                  <p className="text-primary text-sm font-bold mb-1">Wording & Branding</p>
                  <p className="text-sm">Remplacement des slogans incitatifs par des slogans éducatifs/divertissement ("Observez l'élite", "Accès Coulisses"). Rebranding vers <strong>Black Papers</strong>.</p>
                </div>
                <div className="bg-[#1e1e1e] p-3 rounded">
                  <p className="text-primary text-sm font-bold mb-1">Paiement</p>
                  <p className="text-sm">Le paiement anonyme sert uniquement à débloquer le contenu (articles, vidéos, portfolio). L'utilisateur gère ses propres fonds sur ses propres plateformes ailleurs.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-accent" />
                Rappel Juridique
              </h3>
              <p className="text-sm">
                Même sous l'angle du divertissement, assure-toi d'avoir une clause de non-responsabilité (Disclaimer) très visible stipulant que tu ne fournis pas de conseils financiers et que les performances passées ne préjugent pas des performances futures.
              </p>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="w-full mt-4 bg-primary text-black font-bold py-3 rounded hover:bg-primary-dark transition-colors"
            >
              Voir la version mise à jour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};