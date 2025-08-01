import React, { useState } from 'react';

const TestPaymentButton = () => {
    const [showModal, setShowModal] = useState(false);

    const handleClick = () => {
        console.log('Test button clicked!');
        setShowModal(true);
    };

    const closeModal = () => {
        console.log('Closing test modal');
        setShowModal(false);
    };

    console.log('TestPaymentButton render - showModal:', showModal);

    return (
        <>
            <button
                onClick={handleClick}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
                type="button"
            >
                Test Modal
            </button>

            {showModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    style={{ zIndex: 9999 }}
                >
                    <div className="bg-white rounded-lg max-w-sm w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Test Modal</h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                                type="button"
                            >
                                ×
                            </button>
                        </div>
                        <p>This is a test modal to check if modals work properly.</p>
                        <button
                            onClick={closeModal}
                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded w-full"
                            type="button"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default TestPaymentButton;
