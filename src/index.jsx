/** @jsx createElement */

import {createElement, Phrase} from 'lacona-phrase'
import String from 'lacona-phrase-string'
import {DateTime, Range} from 'lacona-phrase-datetime'
import moment from 'moment'

class LocationWithAt extends Phrase {
  describe () {
    return (
      <sequence>
        <list items={[' at ', ' on ', ' in ']} limit={1} category='conjunction' />
        <String argument='location' merge splitOn=' ' limit={1} />
      </sequence>
    )
  }
}

export function executeEvent (result) {
  global.createEvent(result.title, result.location, result.range.start, result.range.end, result.range.allDay, err => {
    if (err) {
      global.notify('Failed to Create Event', '', err, () => {})
    } else {
      global.notify('Created Event', '',  `${result.title} on ${moment(result.range.start).format('LLL')}`, () => {})
    }
  })
}

export class ScheduleEvent extends Phrase {
  describe () {
    return (
      <sequence unique={true}>
        <list items={['schedule ', 'create an event ', 'create event ', 'add an event ', 'add event ']} limit={1} category='action' id='verb' value='schedule' />
        <String limit={1} splitOn=' ' argument='calendar event' id='title' />
        <LocationWithAt optional id='location' prefered={false} />
        <literal text=' ' category='conjunction' />
        <literal text='for ' category='conjunction' optional limited />
        <Range id='range' prepositions />
        <LocationWithAt optional id='location' prefered={false} />
      </sequence>
    )
  }
}

export function executeReminder (result) {
  global.createReminder(result.title, result.date, (err) => {
    if (err) {
      global.notify('Failed to Create Reminder', '', err, () => {})
    } else {
      global.notify('Created Reminder', '', `${result.title} on ${moment(result.date).format('LLL')}`, () => {})
    }
  })
}

export class CreateReminder extends Phrase {
  describe () {
    return (
      <sequence>
        <list items={['remind me to ', 'create reminder ', 'create a reminder ', 'add a reminder ', 'add reminder ']} limit={1} category='action' id='verb' value='remind' />
        <choice merge>
          <String argument='reminder title' id='title' consumeAll />
          <sequence>
            <String limit={1} argument='reminder title' id='title' splitOn=' ' />
            <literal text=' ' category='conjunction' />
            <DateTime id='date' prepositions />
          </sequence>
        </choice>
      </sequence>
    )
  }
}

export default {
  sentences: [
    {Sentence: CreateReminder, execute: executeReminder},
    {Sentence: ScheduleEvent, execute: executeEvent}
  ]
}
