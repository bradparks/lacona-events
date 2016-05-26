/** @jsx createElement */

import { createElement } from 'elliptical'
import { createEvent, createReminder, showNotification } from 'lacona-api'
import { Command, DateTime, Range, String } from 'lacona-phrases'

import moment from 'moment'
import {eventDemoExecute, reminderDemoExecute} from './demo'

// class LocationWithAt extends Phrase {
//   describe () {
//     return (
//       <sequence>
//         <list items={[' at ', ' on ', ' in ']} limit={1} category='conjunction' />
//         <String argument='location' merge splitOn=' ' limit={1} />
//       </sequence>
//     )
//   }
// }

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
    createEvent({
      title: result.title,
      // location: result.location,
      start: result.range.start,
      end: result.range.end,
      allDay: result.range.allDay
    }, (err) => {
      if (err) {
        showNotification({title: 'Failed to Create Event'})
      } else {
        showNotification({
          title: 'Created Event',
          subtitle: result.title,
          content: displayRange(result.range)
        })
      }
    })
  },

  demoExecute: eventDemoExecute,

  describe () {
    return (
      <map function={result => new ScheduleEventObject(result)}>
        <sequence unique={true}>
          <list items={['schedule ', 'create an event ', 'create event ', 'add an event ', 'add event ']} limit={1} category='action' id='verb' value='schedule' />
          <String limit={1} splitOn=' ' argument='calendar event' id='title' />
          {/*<LocationWithAt optional id='location' preferred={false} />*/}
          <literal text=' ' category='conjunction' />
          <literal text='for ' category='conjunction' optional preferred limited />
          <Range id='range' prepositions past={false} seconds={false} />
          {/*<LocationWithAt optional id='location' preferred={false} />*/}
        </sequence>
      </map>
    )
  }
}

export const CreateReminder = {
  extends: [Command],

  demoExecute: reminderDemoExecute,

  execute (result) {
    createReminder({title: result.title, date: result.datetime}, (err) => {
      if (err) {
        showNotification({title: 'Failed to Create Reminder'})
      } else {
        if (result.datetime) {
          showNotification({title: 'Created Reminder', subtitle: result.title, content: `${moment(result.datetime).format('LLL')}`})
        } else {
          showNotification({title: 'Created Reminder', subtitle: result.title})
        }
      }
    })
  },

  describe () {
    return (
      <map function={result => new CreateReminderObject(result)}>
        <sequence>
          <list items={['remind me to ', 'create reminder ', 'create a reminder ', 'add a reminder ', 'add reminder ']} limit={1} category='action' id='verb' value='remind' />
          <choice merge>
            <String argument='reminder title' id='title' consumeAll />
            <sequence>
              <String limit={1} argument='reminder title' id='title' splitOn=' ' />
              <literal text=' ' category='conjunction' />
              <DateTime id='datetime' past={false} prepositions seconds={false} />
            </sequence>
          </choice>
        </sequence>
      </map>
    )
  }
}

export default [ScheduleEvent, CreateReminder]
