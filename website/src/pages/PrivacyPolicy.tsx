import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-lg shadow-lg p-8"
                >
                    <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center font-farsi">
                        {t('privacyPolicy.title')}
                    </h1>

                    <div className="prose prose-lg max-w-none font-farsi text-gray-700 leading-relaxed">
                        <p className="text-lg mb-6 text-gray-600">
                            {t('privacyPolicy.lastUpdated')}
                        </p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('privacyPolicy.introduction.title')}
                            </h2>
                            <p className="mb-4">
                                {t('privacyPolicy.introduction.content')}
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('privacyPolicy.dataCollection.title')}
                            </h2>
                            <p className="mb-4">
                                {t('privacyPolicy.dataCollection.content')}
                            </p>

                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                {t('privacyPolicy.dataCollection.personalInfo.title')}
                            </h3>
                            <ul className="list-disc pl-6 mb-4">
                                <li>{t('privacyPolicy.dataCollection.personalInfo.phone')}</li>
                                <li>{t('privacyPolicy.dataCollection.personalInfo.email')}</li>
                                <li>{t('privacyPolicy.dataCollection.personalInfo.name')}</li>
                                <li>{t('privacyPolicy.dataCollection.personalInfo.password')}</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                {t('privacyPolicy.dataCollection.healthInfo.title')}
                            </h3>
                            <ul className="list-disc pl-6 mb-4">
                                <li>{t('privacyPolicy.dataCollection.healthInfo.gender')}</li>
                                <li>{t('privacyPolicy.dataCollection.healthInfo.age')}</li>
                                <li>{t('privacyPolicy.dataCollection.healthInfo.weight')}</li>
                                <li>{t('privacyPolicy.dataCollection.healthInfo.height')}</li>
                                <li>{t('privacyPolicy.dataCollection.healthInfo.activityLevel')}</li>
                                <li>{t('privacyPolicy.dataCollection.healthInfo.weightGoal')}</li>
                                <li>{t('privacyPolicy.dataCollection.healthInfo.targetWeight')}</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                {t('privacyPolicy.dataCollection.nutritionData.title')}
                            </h3>
                            <ul className="list-disc pl-6 mb-4">
                                <li>{t('privacyPolicy.dataCollection.nutritionData.foodPhotos')}</li>
                                <li>{t('privacyPolicy.dataCollection.nutritionData.mealLogs')}</li>
                                <li>{t('privacyPolicy.dataCollection.nutritionData.calorieData')}</li>
                                <li>{t('privacyPolicy.dataCollection.nutritionData.nutritionInfo')}</li>
                                <li>{t('privacyPolicy.dataCollection.nutritionData.weightEntries')}</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                {t('privacyPolicy.dataCollection.usageData.title')}
                            </h3>
                            <ul className="list-disc pl-6 mb-4">
                                <li>{t('privacyPolicy.dataCollection.usageData.appUsage')}</li>
                                <li>{t('privacyPolicy.dataCollection.usageData.features')}</li>
                                <li>{t('privacyPolicy.dataCollection.usageData.deviceInfo')}</li>
                                <li>{t('privacyPolicy.dataCollection.usageData.logs')}</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('privacyPolicy.dataUsage.title')}
                            </h2>
                            <p className="mb-4">
                                {t('privacyPolicy.dataUsage.content')}
                            </p>
                            <ul className="list-disc pl-6 mb-4">
                                <li>{t('privacyPolicy.dataUsage.provideService')}</li>
                                <li>{t('privacyPolicy.dataUsage.personalizeExperience')}</li>
                                <li>{t('privacyPolicy.dataUsage.improveAccuracy')}</li>
                                <li>{t('privacyPolicy.dataUsage.sendNotifications')}</li>
                                <li>{t('privacyPolicy.dataUsage.analytics')}</li>
                                <li>{t('privacyPolicy.dataUsage.support')}</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('privacyPolicy.dataSharing.title')}
                            </h2>
                            <p className="mb-4">
                                {t('privacyPolicy.dataSharing.content')}
                            </p>
                            <ul className="list-disc pl-6 mb-4">
                                <li>{t('privacyPolicy.dataSharing.serviceProviders')}</li>
                                <li>{t('privacyPolicy.dataSharing.legalRequirements')}</li>
                                <li>{t('privacyPolicy.dataSharing.userConsent')}</li>
                                <li>{t('privacyPolicy.dataSharing.businessTransfer')}</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('privacyPolicy.dataSecurity.title')}
                            </h2>
                            <p className="mb-4">
                                {t('privacyPolicy.dataSecurity.content')}
                            </p>
                            <ul className="list-disc pl-6 mb-4">
                                <li>{t('privacyPolicy.dataSecurity.encryption')}</li>
                                <li>{t('privacyPolicy.dataSecurity.accessControl')}</li>
                                <li>{t('privacyPolicy.dataSecurity.secureStorage')}</li>
                                <li>{t('privacyPolicy.dataSecurity.regularAudits')}</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('privacyPolicy.userRights.title')}
                            </h2>
                            <p className="mb-4">
                                {t('privacyPolicy.userRights.content')}
                            </p>
                            <ul className="list-disc pl-6 mb-4">
                                <li>{t('privacyPolicy.userRights.access')}</li>
                                <li>{t('privacyPolicy.userRights.correction')}</li>
                                <li>{t('privacyPolicy.userRights.deletion')}</li>
                                <li>{t('privacyPolicy.userRights.portability')}</li>
                                <li>{t('privacyPolicy.userRights.objection')}</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('privacyPolicy.dataRetention.title')}
                            </h2>
                            <p className="mb-4">
                                {t('privacyPolicy.dataRetention.content')}
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('privacyPolicy.children.title')}
                            </h2>
                            <p className="mb-4">
                                {t('privacyPolicy.children.content')}
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('privacyPolicy.changes.title')}
                            </h2>
                            <p className="mb-4">
                                {t('privacyPolicy.changes.content')}
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {t('privacyPolicy.contact.title')}
                            </h2>
                            <p className="mb-4">
                                {t('privacyPolicy.contact.content')}
                            </p>
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <p><strong>{t('privacyPolicy.contact.email')}:</strong> erfaneillat@gmail.com</p>
                                <p><strong>{t('privacyPolicy.contact.phone')}:</strong> ۰۹۱۴۹۶۶۸۰۰۶</p>
                                <p><strong>{t('privacyPolicy.contact.address')}:</strong> آذربایجان غربی، ارومیه، محله آزادی، کوچه شهیدرضا اسماعیل پور، پلاک ۸</p>
                            </div>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
