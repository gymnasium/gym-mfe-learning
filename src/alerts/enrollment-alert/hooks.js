/* eslint-disable import/prefer-default-export */
import React, {
  useContext, useMemo,
} from 'react';
import { AppContext } from '@edx/frontend-platform/react';

import { useAlert } from '@src/generic/user-messages';
import { useModel } from '@src/generic/model-store';

const EnrollmentAlert = React.lazy(() => import('./EnrollmentAlert'));

export function useEnrollmentAlert(courseId) {
  const { authenticatedUser } = useContext(AppContext);
  const course = useModel('courseHomeMeta', courseId);
  const outline = useModel('outline', courseId);
  const enrolledUser = course && course.isEnrolled !== undefined && course.isEnrolled;
  const privateOutline = outline && outline.courseBlocks && !outline.courseBlocks.courses;
  /**
   * This alert should render if
   *    1. the user is not enrolled,
   *    2. the user is authenticated, AND
   *    3. the course is private.
   */
  const isVisible = !enrolledUser && authenticatedUser !== null && privateOutline;
  const payload = useMemo(() => ({
    canEnroll: outline && outline.enrollAlert ? outline.enrollAlert.canEnroll : false,
    courseId,
    extraText: outline && outline.enrollAlert ? outline.enrollAlert.extraText : '',
    isStaff: course && course.isStaff,
  }), [course, courseId, outline]);

  useAlert(isVisible, {
    code: 'clientEnrollmentAlert',
    payload,
    topic: 'outline',
  });

  return { clientEnrollmentAlert: EnrollmentAlert };
}
