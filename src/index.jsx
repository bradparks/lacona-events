/** @jsx createElement */

import _ from 'lodash'
import { createElement } from 'elliptical'
import { createEvent, createReminder, showNotification, fetchReminderLists, fetchCalendars, canAccessReminders, canAccessEvents } from 'lacona-api'
import { Command, DateTime, Range, String } from 'lacona-phrases'

import { fromPromise } from 'rxjs/observable/fromPromise'
import { startWith } from 'rxjs/operator/startWith'

import moment from 'moment'
import {eventDemoExecute, reminderDemoExecute} from './demo'

const CalendarSource = {
  clear: true,
  fetch () {
    return fromPromise(
      fetchCalendars().then(calendars => _.chain(calendars)
        .filter('title')
        .filter('id')
        .filter('canEdit')
        .map(calendar => ({text: calendar.title, value: calendar}))
        .value()
      ))::startWith([])
  }
}

const ReminderListSource = {
  clear: true,
  fetch () {
    return fromPromise(
      fetchReminderLists().then(lists => _.chain(lists)
        .filter('title')
        .filter('id')
        .filter('canEdit')
        .map(list => ({text: list.title, value: list}))
        .value()
      ))::startWith([])
  }
}

function displayRange({start, end, allDay}) {
  const startM = moment(start)
  const endM = moment(end)

  if (allDay) {
    if (start === end) {
      return `All Day ${startM.format('LL')}`
    } else {
      return `All Day ${startM.format('LL')} to ${endM.format('LL')}`
    }
  } else {
    if (endM.isAfter(startM, 'day')) {
      return `${startM.format('LLL')} to ${endM.format('LLL')}`
    } else {
      return `${startM.format('LL')} ${startM.format('LT')} to ${endM.format('LT')}`
    }
  }
}

export const ScheduleEvent = {
  extends: [Command],

  execute (result) {
    const calendar = result.calendar ? result.calendar.id : undefined

    createEvent({
      title: result.title,
      location: result.location,
      start: result.range.start,
      end: result.range.end,
      allDay: result.range.allDay,
      calendar
    }).then(() => {
      const title = result.calendar ?  `Created Event in ${result.calendar.title}` : 'Created Event'
      showNotification({
        title,
        subtitle: result.title,
        content: displayRange(result.range)
      })
    }).catch(err => {
      showNotification({title: 'Failed to Create Event'})
    })
  },

  demoExecute: eventDemoExecute,

  describe ({observe, config}) {
    if (!config.enableSchedule) return

    const calendars = observe(<CalendarSource />)

    return (
      <sequence unique>
        <list items={['schedule ', 'create an event ', 'create event ', 'add an event ', 'add event ']} limit={1} />
        <String limit={1} splitOn=' ' label='calendar event' id='title' />
        <sequence optional limited preferred id='calendar'>
          <list items={[' on ', ' in ', ' to ']} limit={1} />
          <placeholder argument='calendar' merge suppressEmpty={false}>
            <list items={calendars} />
          </placeholder>
        </sequence>
        {/*<sequence optional limited id='location'>
          <list items={[' at ', ' on ', ' in ']} limit={1} />
          <String label='location' merge splitOn=' ' limit={1} />
        </sequence>*/}
        <sequence optional limited preferred id='calendar'>
          <list items={[' on ', ' in ', ' to ']} limit={1} />
          <placeholder argument='calendar' merge suppressEmpty={false}>
            <list items={calendars} />
          </placeholder>
        </sequence>
        <sequence ellipsis id='range'>
          <literal text=' ' />
          <literal text='for ' optional preferred limited />
          <Range merge prepositions past={false} seconds={false} />
        </sequence>
        <sequence optional limited preferred id='calendar'>
          <list items={[' on ', ' in ', ' to ']} limit={1} />
          <placeholder argument='calendar' merge suppressEmpty={false}>
            <list items={calendars} />
          </placeholder>
        </sequence>
        {/*<sequence optional limited ellipsis id='location'>
          <list items={[' at ', ' on ', ' in ']} limit={1} />
          <String label='location' merge splitOn=' ' limit={1} />
        </sequence>
        <sequence id='calendar'>
          <list items={[' on ', ' in ', ' to ']} limit={1} />
          <placeholder argument='calendar' merge suppressEmpty={false}>
            <list items={calendars} />
          </placeholder>
        </sequence>*/}
      </sequence>
    )
  }
}

export const CreateReminder = {
  extends: [Command],

  demoExecute: reminderDemoExecute,

  execute (result) {
    const reminderList = result.reminderList ? result.reminderList.id : undefined
    createReminder({title: result.title, date: result.datetime, reminderList}).then(() => {
      const title = result.reminderList ? `Created Reminder in ${result.reminderList.title}` : 'Created Reminder'
      if (result.datetime) {
        showNotification({title, subtitle: result.title, content: `${moment(result.datetime).format('LLL')}`})
      } else {
        showNotification({title, subtitle: result.title})
      }
    }).catch(err => {
      showNotification({title: 'Failed to Create Reminder'})
    })
  },

  describe ({observe, config}) {
    if (!config.enableCreateReminder) return

    const reminderLists = observe(<ReminderListSource />)

    return (
      <choice>
        <sequence unique>
          <list items={['remind me to ', 'create reminder ', 'create a reminder ', 'add a reminder ', 'add reminder ']} limit={1} />
          <String label='reminder title' id='title' ellipsis />
          <sequence optional limited ellipsis id='reminderList'>
            <literal text=' in ' />
            <placeholder argument='reminder list' merge suppressEmpty={false}>
              <list items={reminderLists} />
            </placeholder>
          </sequence>
          <sequence ellipsis id='datetime'>
            <literal text=' ' category='conjunction' />
            <DateTime past={false} prepositions seconds={false} merge />
          </sequence>
          <sequence id='reminderList'>
            <literal text=' in ' />
            <placeholder argument='reminder list' merge suppressEmpty={false}>
              <list items={reminderLists} />
            </placeholder>
          </sequence>
        </sequence>
        <sequence unique>
          <literal text='add ' />
          <String label='reminder title' id='title' />
          <sequence id='datetime' optional>
            <literal text=' ' />
            <DateTime past={false} seconds={false} merge />
          </sequence>
          <sequence ellipsis id='reminderList'>
            <list items={[' to ', ' in ']} limit={1} />
            <placeholder argument='reminder list' merge suppressEmpty={false}>
              <list items={reminderLists} />
            </placeholder>
          </sequence>
          <sequence id='datetime'>
            <literal text=' due ' />
            <DateTime past={false} seconds={false} merge />
          </sequence>
        </sequence>
      </choice>
    )
  }
}

async function onLoadConfig ({observe, config, setConfig}) {
  if (config.enableSchedule) {
    if (await canAccessEvents()) {
      observe(<CalendarSource />)
    } else {
      const newConfig = _.clone(config)
      newConfig.enableSchedule = false
      setConfig(newConfig)
    }
  }

  if (config.enableCreateReminder) {
    if (await canAccessReminders()) {
      observe(<ReminderListSource />)
    } else {
      const newConfig = _.clone(config)
      newConfig.enableCreateReminder = false
      setConfig(newConfig)
    }
  }
}

export const extensions = [ScheduleEvent, CreateReminder]
export const hooks = {onLoadConfig}
