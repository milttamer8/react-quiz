import React from 'react';
import UserProfile from '../../session/UserProfile';
import { useTranslation } from "react-i18next";

/*
 *   Cookie policy static page
*/
export default function CookiePolicy(props) {
  const {t} = useTranslation('common');

    return (
      <div className="infosGeneral container">
        <div className="col-12">
          {
            UserProfile.getSite() === 'core' ? 
              <div dangerouslySetInnerHTML={{ __html: t('cookie_policy_core.title') }} />
            :           
              <div dangerouslySetInnerHTML={{ __html: t('cookie_policy_senior.title') }} />
            
          }
        </div>
      </div>
    );
}