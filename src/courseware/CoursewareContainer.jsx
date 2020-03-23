import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { history, getConfig } from '@edx/frontend-platform';

import { useRouteMatch } from 'react-router';
import {
  fetchCourse,
  fetchSequence,
} from '../data';
import {
  checkBlockCompletion,
  saveSequencePosition,
} from './data/thunks';
import { useModel } from '../model-store';

import Course from './course';

import { sequenceIdsSelector, firstSequenceIdSelector } from './data/selectors';

function useUnitNavigationHandler(courseUsageKey, sequenceId, unitId) {
  const dispatch = useDispatch();
  return useCallback((nextUnitId) => {
    dispatch(checkBlockCompletion(courseUsageKey, sequenceId, unitId));
    history.replace(`/course/${courseUsageKey}/${sequenceId}/${nextUnitId}`);
  }, [courseUsageKey, sequenceId]);
}

function usePreviousSequence(sequenceId) {
  const sequenceIds = useSelector(sequenceIdsSelector);
  const sequences = useSelector(state => state.models.sequences);
  if (!sequenceId || sequenceIds.length === 0) {
    return null;
  }
  const sequenceIndex = sequenceIds.indexOf(sequenceId);
  const previousSequenceId = sequenceIndex > 0 ? sequenceIds[sequenceIndex - 1] : null;
  return previousSequenceId !== null ? sequences[previousSequenceId] : null;
}

function useNextSequence(sequenceId) {
  const sequenceIds = useSelector(sequenceIdsSelector);
  const sequences = useSelector(state => state.models.sequences);
  if (!sequenceId || sequenceIds.length === 0) {
    return null;
  }
  const sequenceIndex = sequenceIds.indexOf(sequenceId);
  const nextSequenceId = sequenceIndex < sequenceIds.length - 1 ? sequenceIds[sequenceIndex + 1] : null;
  return nextSequenceId !== null ? sequences[nextSequenceId] : null;
}


function useNextSequenceHandler(courseUsageKey, sequenceId) {
  const nextSequence = useNextSequence(sequenceId);
  const courseStatus = useSelector(state => state.courseware.courseStatus);
  const sequenceStatus = useSelector(state => state.courseware.sequenceStatus);
  return useCallback(() => {
    if (nextSequence !== null) {
      const nextUnitId = nextSequence.unitIds[0];
      history.replace(`/course/${courseUsageKey}/${nextSequence.id}/${nextUnitId}`);
    }
  }, [courseStatus, sequenceStatus, sequenceId]);
}

function usePreviousSequenceHandler(courseUsageKey, sequenceId) {
  const previousSequence = usePreviousSequence(sequenceId);
  const courseStatus = useSelector(state => state.courseware.courseStatus);
  const sequenceStatus = useSelector(state => state.courseware.sequenceStatus);
  return useCallback(() => {
    if (previousSequence !== null) {
      const previousUnitId = previousSequence.unitIds[previousSequence.unitIds.length - 1];
      history.replace(`/course/${courseUsageKey}/${previousSequence.id}/${previousUnitId}`);
    }
  }, [courseStatus, sequenceStatus, sequenceId]);
}

function useExamRedirect(sequenceId) {
  const sequence = useModel('sequences', sequenceId);
  const sequenceStatus = useSelector(state => state.courseware.sequenceStatus);
  useEffect(() => {
    if (sequenceStatus === 'loaded' && sequence.isTimeLimited) {
      global.location.assign(sequence.lmsWebUrl);
    }
  }, [sequenceStatus, sequence]);
}

function useContentRedirect(courseStatus, sequenceStatus) {
  const match = useRouteMatch();
  const { courseUsageKey, sequenceId, unitId } = match.params;
  const sequence = useModel('sequences', sequenceId);
  const firstSequenceId = useSelector(firstSequenceIdSelector);
  useEffect(() => {
    if (courseStatus === 'loaded' && !sequenceId) {
      history.replace(`/course/${courseUsageKey}/${firstSequenceId}`);
    }
  }, [courseStatus, sequenceId]);

  useEffect(() => {
    if (sequenceStatus === 'loaded' && sequenceId && !unitId) {
      // The position may be null, in which case we'll just assume 0.
      if (sequence.unitIds !== undefined && sequence.unitIds.length > 0) {
        const unitIndex = sequence.position || 0;
        const nextUnitId = sequence.unitIds[unitIndex];
        history.replace(`/course/${courseUsageKey}/${sequence.id}/${nextUnitId}`);
      }
    }
  }, [sequenceStatus, sequenceId, unitId]);
}

function useSavedSequencePosition(courseUsageKey, sequenceId, unitId) {
  const dispatch = useDispatch();
  const sequence = useModel('sequences', sequenceId);
  const sequenceStatus = useSelector(state => state.courseware.sequenceStatus);
  useEffect(() => {
    if (sequenceStatus === 'loaded' && sequence.savePosition) {
      const activeUnitIndex = sequence.unitIds.indexOf(unitId);
      dispatch(saveSequencePosition(courseUsageKey, sequenceId, activeUnitIndex));
    }
  }, [unitId]);
}

/**
 * Redirects the user away from the app if they don't have access to view this course.
 *
 * @param {*} courseStatus
 * @param {*} course
 */
function useAccessDeniedRedirect(courseStatus, courseId) {
  const course = useModel('courses', courseId);
  useEffect(() => {
    if (courseStatus === 'loaded' && !course.userHasAccess) {
      global.location.assign(`${getConfig().LMS_BASE_URL}/courses/${course.id}/course/`);
    }
  }, [courseStatus, course]);
}

export default function CoursewareContainer() {
  const { params } = useRouteMatch();
  const {
    courseUsageKey: routeCourseUsageKey,
    sequenceId: routeSequenceId,
    unitId: routeUnitId,
  } = params;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCourse(routeCourseUsageKey));
  }, [routeCourseUsageKey]);

  useEffect(() => {
    if (routeSequenceId) {
      dispatch(fetchSequence(routeSequenceId));
    }
  }, [routeSequenceId]);

  // The courseUsageKey and sequenceId in the store are the entities we currently have loaded.
  // We get these two IDs from the store because until fetchCourse and fetchSequence below have
  // finished their work, the IDs in the URL are not representative of what we should actually show.
  // This is important particularly when switching sequences.  Until a new sequence is fully loaded,
  // there's information that we don't have yet - if we use the URL's sequence ID to tell the app
  // which sequence is loaded, we'll instantly try to pull it out of the store and use it, before
  // the sequenceStatus flag has even switched back to "loading", which will put our app into an
  // invalid state.
  const {
    courseUsageKey,
    sequenceId,
    courseStatus,
    sequenceStatus,
  } = useSelector(state => state.courseware);

  const nextSequenceHandler = useNextSequenceHandler(courseUsageKey, sequenceId);
  const previousSequenceHandler = usePreviousSequenceHandler(courseUsageKey, sequenceId);
  const unitNavigationHandler = useUnitNavigationHandler(courseUsageKey, sequenceId, routeUnitId);

  useAccessDeniedRedirect(courseStatus, courseUsageKey);
  useContentRedirect(courseStatus, sequenceStatus);
  useExamRedirect(sequenceId);
  useSavedSequencePosition(courseUsageKey, sequenceId, routeUnitId);

  return (
    <main className="flex-grow-1 d-flex flex-column">
      <Course
        courseId={courseUsageKey}
        sequenceId={sequenceId}
        unitId={routeUnitId}
        nextSequenceHandler={nextSequenceHandler}
        previousSequenceHandler={previousSequenceHandler}
        unitNavigationHandler={unitNavigationHandler}
      />
    </main>
  );
}

CoursewareContainer.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      courseUsageKey: PropTypes.string.isRequired,
      sequenceId: PropTypes.string,
      unitId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};
