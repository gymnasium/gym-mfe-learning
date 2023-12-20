import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { useSelector } from 'react-redux';

import Updates from './widgets/Updates';

const UpdatesTab = ({ intl }) => {

  const {
    courseId,
  } = useSelector(state => state.courseHome);

  return (
    <Updates courseId={courseId} />
  );
};

UpdatesTab.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(UpdatesTab);
