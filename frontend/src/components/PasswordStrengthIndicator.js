import React, { useEffect, useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import SummaryApi from '../common';

const PasswordStrengthIndicator = ({ password, onStrengthChange }) => {
    const [strengthData, setStrengthData] = useState({
        strength: 'weak',
        progress: 0,
        criteria: {},
        suggestions: []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!password) {
            setStrengthData({
                strength: 'weak',
                progress: 0,
                criteria: {},
                suggestions: []
            });
            onStrengthChange && onStrengthChange({ strength: 'weak', isValid: false });
            return;
        }

        const debounceTimer = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await fetch(SummaryApi.passwordStrength.url, {
                    method: SummaryApi.passwordStrength.method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ password })
                });

                const result = await response.json();

                if (result.success) {
                    setStrengthData(result.data);
                    onStrengthChange && onStrengthChange({
                        strength: result.data.strength,
                        isValid: result.data.isValid
                    });
                }
            } catch (error) {
                console.error('Error checking password strength:', error);
            } finally {
                setLoading(false);
            }
        }, 300); // Debounce for 300ms

        return () => clearTimeout(debounceTimer);
    }, [password, onStrengthChange]);

    const getStrengthColor = (strength) => {
        switch (strength) {
            case 'strong': return 'text-green-600';
            case 'medium': return 'text-yellow-600';
            default: return 'text-red-600';
        }
    };

    const getProgressBarColor = (strength) => {
        switch (strength) {
            case 'strong': return 'bg-green-500';
            case 'medium': return 'bg-yellow-500';
            default: return 'bg-red-500';
        }
    };

    const criteriaLabels = {
        length: 'At least 8 characters',
        uppercase: 'One uppercase letter',
        lowercase: 'One lowercase letter',
        numbers: 'One number',
        specialChars: 'One special character',
        noCommonPatterns: 'No common patterns'
    };

    if (!password) return null;

    return (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Password Strength:</span>
                <span className={`text-sm font-semibold capitalize ${getStrengthColor(strengthData.strength)}`}>
                    {loading ? 'Checking...' : strengthData.strength}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(strengthData.strength)}`}
                    style={{ width: `${strengthData.progress}%` }}
                ></div>
            </div>

            {/* Criteria Checklist */}
            <div className="space-y-1">
                {Object.entries(criteriaLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center text-xs">
                        <div className={`mr-2 ${strengthData.criteria[key] ? 'text-green-500' : 'text-red-500'}`}>
                            {strengthData.criteria[key] ? <FaCheck size={10} /> : <FaTimes size={10} />}
                        </div>
                        <span className={strengthData.criteria[key] ? 'text-green-700' : 'text-red-700'}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Suggestions */}
            {strengthData.suggestions && strengthData.suggestions.length > 0 && (
                <div className="mt-3 p-2 bg-red-50 rounded border-l-4 border-red-400">
                    <p className="text-xs font-medium text-red-800 mb-1">Suggestions:</p>
                    <ul className="text-xs text-red-700 space-y-1">
                        {strengthData.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PasswordStrengthIndicator;
