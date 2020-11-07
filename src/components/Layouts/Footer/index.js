import React from 'react'
import { useTranslation } from "react-i18next";
import UserProfile from '../../../session/UserProfile';
import { Link } from "react-router-dom";

export default function Footer() {
    const {t} = useTranslation('common');
    return (
        UserProfile.getSite() === "core" ?
        <footer className='footer'>
            <ul className="navFooter">
                <li className="item">
                    <Link to="terms-conditions" target="_blank">{t('terms_conditions.title')}</Link>
                </li>
                <li className="item">
                    <Link to="privacy-policy" target="_blank">{t('privacy_policy.title')}</Link>
                </li>
                <li className="item">
                    <Link to="cookie-policy" target="_blank">{t('cookie_policy.title')}</Link>
                </li>
            </ul>
            <p className="para">
                <span className="span">&copy; {t('2020_meetic.title')} </span>
                {t('rights.title')}
                <span className="span"> {t('meetic_site.title')}</span>
            </p>
        </footer>
        :
        <footer className='footer'>
            <ul className="navFooter">
                <li className="item">
                    <Link to="terms-conditions" target="_blank">{t('terms_conditions.title')}</Link>
                </li>
                <li className="item">
                    <Link to="privacy-policy" target="_blank">{t('privacy_policy.title')}</Link>
                </li>
                <li className="item">
                    <Link to="cookie-policy" target="_blank">{t('cookie_policy.title')}</Link>
                </li>
            </ul>
            <p className="para">
                <span className="span">&copy; {t('2020_by_ourtime.title')} </span>
                {t('rights.title')}
                <span className="span"> {t('meetic_site.title')}</span>
            </p>
        </footer>
    )
}
