'use client'
import { createClient } from '@/lib/supabase/client'
import { sessionFields } from './types'

// Only this module talks to the native Supabase schedule API. Ownership is
// enforced by RLS and booking races by the database scheduling guard.
export function createTeacherRepository() {
  const db = createClient()
  return {
    load: (teacherId: string) => Promise.all([
      db.from('class_sessions').select(sessionFields).eq('teacher_id',teacherId).neq('status','cancelled').order('starts_at'),
      db.from('teacher_availability').select('id,teacher_id,day_of_week,start_time,end_time,timezone,is_active').eq('teacher_id',teacherId).order('day_of_week'),
      db.rpc('calendar_students',{p_teacher:teacherId}),
    ]),
    saveHours: (values: {teacher_id:string;day_of_week:number;start_time:string;end_time:string;timezone:string;is_active:boolean}, id?:string) => id
      ? db.from('teacher_availability').update(values).eq('id',id).eq('teacher_id',values.teacher_id).select('id')
      : db.from('teacher_availability').insert(values).select('id'),
    saveSlot: (teacherId:string,values:{title:string;starts_at:string;ends_at:string},timezone:string,id?:string) => id
      ? db.from('class_sessions').update(values).eq('id',id).eq('teacher_id',teacherId).eq('status','open').select('id')
      : db.from('class_sessions').insert({...values,teacher_id:teacherId,timezone,status:'open'}).select('id'),
    moveSlot: (teacherId:string,id:string,start:Date,end:Date) => db.from('class_sessions').update({starts_at:start.toISOString(),ends_at:end.toISOString()}).eq('id',id).eq('teacher_id',teacherId).eq('status','open').select('id'),
    changeStatus: async (teacherId:string,id:string,previous:string,status:string) => {
      if(status==='completed') {
        const {error}=await db.rpc('calendar_complete',{p_session:id})
        return {data:error?null:[{id}],error}
      }
      return db.from('class_sessions').update({status}).eq('id',id).eq('teacher_id',teacherId).eq('status',previous).select('id')
    },
  }
}
