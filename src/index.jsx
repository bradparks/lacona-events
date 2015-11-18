/** @jsx createElement */

import {createElement, Phrase} from 'lacona-phrase'
import String from 'lacona-phrase-string'
import {DateTime, Time, Date as DatePhrase, TimePeriod} from 'lacona-phrase-datetime'
import moment from 'moment'

class LocationWithAt extends Phrase {
  describe () {
    return (
      <sequence>
        <list items={[' at ', ' on ', ' in ']} limit={1} category='conjunction' />
        <argument text='location' merge={true}>
          <freetext limit={1} splitOn=' ' />
        </argument>
      </sequence>
    )
  }
}

export function execute (result) {
  global.createReminder(result.title, result.location, result.startDate, result.endDate, false, 15*60, err => {
    if (err) {
      global.notify('Failed to Create Event', '', err)
    } else {
      global.notify('Created Event', '',  `${result.text} on ${moment(result.date).format('LLL')}`)
    }
  })
}

export class ScheduleEvent extends Phrase {
  describe () {
    return (
      <sequence unique={true}>
        <list items={['schedule ', 'create an event ', 'create event ', 'add an event ', 'add event ']} limit={1} category='action' />
        <String limit={1} splitOn=' ' argument='calendar event' id='title' />
        <LocationWithAt optional={true} id='location' prefered={false} />
        <list items={[' for ', ' at ', ' ']} category='conjunction' limit={1} />
        <choice limit={1} merge={true}>
          <DateTime id='datetime' />
          <Time id='time' />
          <DatePhrase id='date' />
          <TimePeriod id='period' />
        </choice>
        <LocationWithAt optional={true} prefered={false} id='location' />
      </sequence>
    )
  }
}

export function executeEvent (result) {}

export function executeReminder (result) {
  global.createReminder(result.title, result.date, (err) => {
    if (err) {
      global.notify('Failed to Create Reminder', '', err)
    } else {
      global.notify('Created Reminder', '', `${result.title} on ${moment(result.date).format('LLL')}`)
    }
  })
}

export class CreateReminder extends Phrase {
  describe () {
    return (
      <sequence id='reminder'>
        <list items={['remind me to ', 'create reminder ', 'create a reminder ', 'add a reminder ', 'add reminder ']} limit={1} category='action' />
        <String argument='reminder title' id='title' limit={1} splitOn=' ' />
        <sequence optional={true} merge={true}>
          <literal text=' ' category='conjunction' />
          <choice merge={true}>
            <Time id='time' includeAt={true} allowPast={false} />
            <DatePhrase id='date' allowPast={false} />
            <DateTime id='datetime' includeAt={true} allowPast={false} />
          </choice>
        </sequence>
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
