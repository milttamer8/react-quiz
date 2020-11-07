import React from 'react';
import UserProfile from '../../session/UserProfile';
import { useTranslation } from "react-i18next";

/*
 *   Static privacy policy page
*/
export default function PrivacyPolicy(props) {
  const {t} = useTranslation('common');

    return (
      <div className="infosGeneral container">
        <div className="col-12">
          {
            UserProfile.getSite() === 'core' ? 
              <div dangerouslySetInnerHTML={{ __html: t('privacy_policy_core.title') }} />
            :           
              <div dangerouslySetInnerHTML={{ __html: t('privacy_policy_senior.title') }} />
            
          }
        </div>
      </div>
    );
}